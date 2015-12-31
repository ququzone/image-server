package main

import (
	"log"

	"github.com/mediocregopher/radix.v2/redis"
)

func main() {
	conn, err := redis.Dial("tcp", "localhost:6379")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	keys, err := conn.Cmd("KEYS", "image:cache:*").List()
	if err != nil {
		log.Fatal(err)
	}

	for _, key := range keys {
		conn.Cmd("DEL", key)
	}
}
