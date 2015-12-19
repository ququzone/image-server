package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"
	"sync"
	"time"

	"github.com/mediocregopher/radix.v2/pool"
	"github.com/mediocregopher/radix.v2/redis"
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

type assignResult struct {
	FID       string
	URL       string
	PublicURL string
	Count     int
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
		fid := saveFileToFS(data)
		conn.PipeAppend("HDEL", "image:file:"+key, "data")
		conn.PipeAppend("HSET", "image:file:"+key, "dfid", fid)
		conn.PipeResp()
		processSubImages(conn, "cache", key)
		processSubImages(conn, "smart", key)
	}
}

func processSubImages(conn *redis.Client, typeName string, key string) {
	var typeKey = "image:" + typeName + ":" + key
	keys, err := conn.Cmd("HKEYS", typeKey).List()
	if err != nil {
		log.Fatal("fetch all sub hash keys error")
	}
	for _, name := range keys {
		data, _ := conn.Cmd("HGET", typeKey, name).Bytes()
		fid := saveFileToFS(data)
		conn.Cmd("HSET", typeKey, name, fid)
	}
}

func saveFileToFS(file []byte) string {
	client := &http.Client{}
	assReq, err := http.NewRequest("POST", "http://localhost:9333/dir/assign", nil)
	if err != nil {
		log.Fatal(err)
	}
	assResp, err := client.Do(assReq)
	body, err := ioutil.ReadAll(assResp.Body)
	if err != nil {
		log.Fatal(err)
	}
	defer assResp.Body.Close()
	var ar assignResult
	json.Unmarshal(body, &ar)

	saveBody := &bytes.Buffer{}
	writer := multipart.NewWriter(saveBody)
	part, err := writer.CreateFormField("file")
	if err != nil {
		log.Fatal(err)
	}
	part.Write(file)
	err = writer.Close()
	if err != nil {
		log.Fatal(err)
	}

	saveReq, err := http.NewRequest("PUT", "http://"+ar.URL+"/"+ar.FID, saveBody)
	saveReq.Header.Add("Content-Type", writer.FormDataContentType())
	saveResp, err := client.Do(saveReq)
	if err != nil {
		log.Fatal(err)
	}
	body, err = ioutil.ReadAll(saveResp.Body)
	defer saveResp.Body.Close()
	return ar.FID
}
