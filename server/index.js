import express from "express";
import cors from "cors";
import { createClient } from "redis";
import { encode } from "./services/encoder.js";

const app = express();

app.use(express.json());
app.use(cors());

// inizialize redis
const redisClient = createClient({
    url: "redis://localhost:6379"
})
redisClient.on('connect', () => {
    console.log('Connected to redis');
});

redisClient.on('error', () => {
    console.log('Some error with connecting to redis');
});



app.listen(3001, async () => { //callback function get executes if listen start correctly
    await redisClient.connect();
    console.log("Server up and running");
});

// endpoint to pass long url
// usiamo async perchè facciamo chiamate al db (usiamo wait)
app.post('/shorten', async(req, res) => {
    const {longUrl} = req.body;
    console.log('longUrl received: ' + longUrl);

    if(longUrl){
        // we get the long url
        // to encode the url, we use a number as "seed". We get this number from redis
        try{
            const id = await redisClient.incr('globalCounter');
            console.log('redis ID is now: ' + id);
            const shortUrl = encode(id);
            console.log('Generated short url is ' + shortUrl);

            //build full link with domain

            await redisClient.hSet('urls', shortUrl, longUrl)

            res.status(200).json({
                status: true,
                data: shortUrl
            })
        }catch(error){
            res.status(400).json({
                status: false,
                error: error
            })

        }
    }else{
        console.log('not a url??');
        // if any problem, we return this response
        res.status(400).json({
            status: false,  
            error: "Not an URL",
        })
    }
});


//da shortUrl (id) a longUrl (value)
app.get('/:shortUrl', async(req, res) => {
    const shortUrl = req.params.shortUrl;
    console.log('shortUrl received is: '+ shortUrl);
    console.log('looking into redis...')

    if(shortUrl){
        try{
            // check if value exists (hExists cause we're using hash)
            const exists = await redisClient.hExists("urls", shortUrl);
            if(!exists){
                res.status(400).json({
                    status: false,
                    error: "short url not found",
                })
            }else{
                // value exists
                const longUrl = await redisClient.hGet("urls", shortUrl);
                console.log('key exists:' + longUrl);
                res.status(200).json({
                    status: true,
                    data: longUrl,
                })

            }

        }catch(error){
            console.log(error);
            res.status(400).json({
                status: false,  
                error: "Not an URLaa",
            })
        }

    }else{
        console.log('not a url??');
        // if any problem, we return this response
        res.status(400).json({
            status: false,  
            error: "Not an URL",
        })
    }
})