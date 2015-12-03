package main

import (
	"bytes"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/mediocregopher/radix.v2/pool"
)

func main() {
	log.Println("Prepare migrate Redis file to SeaweedFS...")
	startTime := time.Now()
	var wg sync.WaitGroup

	p, err := pool.New("tcp", "localhost:6379", 10)
	if err != nil {
		log.Fatal(err)
	}
	defer p.Empty()

	conn, err := p.Get()
	if err != nil {
		log.Fatal(err)
	}

	length, err := conn.Cmd("LLEN", "image:all").Int64()
	if err != nil {
		log.Fatal(err)
	}
	p.Put(conn)

	end := length / 1000
	if length%1000 != 0 {
		end++
	}

	for i := int64(0); i < end; i++ {
		wg.Add(1)
		go migrateRange(&wg, p, i*1000, (i+1)*1000-1)
	}

	wg.Wait()
	log.Printf("Migate Redis file success in %v.\n", time.Now().Sub(startTime))
}

func migrateRange(wg *sync.WaitGroup, pool *pool.Pool, start int64, end int64) {
	defer wg.Done()

	conn, err := pool.Get()
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Put(conn)

	keys, err := conn.Cmd("LRANGE", "image:all", start, end).List()
	if err != nil {
		log.Fatal(err)
	}

	for _, key := range keys {
		data, err := conn.Cmd("HGET", "image:file:"+key, "data").Bytes()
		if err != nil {
			log.Fatal(err)
		}
		resp, err := http.Post("http://localhost:9333", "application/octet-stream", bytes.NewReader(data))
		if err != nil {
			log.Fatal(err)
		}
		defer resp.Body.Close()
	}
}
