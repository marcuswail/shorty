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


function isValidURL(url) {
  try {
    // se manca lo schema, aggiunge "http://"
    const prefixed = url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)
      ? url
      : `http://${url}`;

    new URL(prefixed); // se non è valido, lancia errore
    return true;
  } catch (err) {
    return false;
  }
}


// endpoint to pass long url
// usiamo async perchè facciamo chiamate al db (usiamo wait)
app.post('/api/shorten', async(req, res) => {
    const { longUrl, expire } = req.body;
    console.log('longUrl received: ' + longUrl);

    if(longUrl){
        // we get the long url
        // to encode the url, we use a number as "seed". We get this number from redis

        //if longUrl is missing http, we add it
        if(!isValidURL(longUrl)){
            res.status(400).json({
                status: false,
                error: 'Invalid URL'
            })
        }
        try{
            const id = await redisClient.incr('globalCounter');
            console.log('redis ID is now: ' + id);
            const shortUrl = encode(id);
            console.log('Generated short url is ' + shortUrl);

            await redisClient.hSet('urls', shortUrl, longUrl)

            res.status(200).json({
                status: true,
                data: "http://localhost:3001/"+ shortUrl
            })

            // if expire is setted, let's set it...
            if (expire){
                console.log("User setted expire");
                const seconds = 10;
                // HEXPIRE urls <seconds> FIELDS 1 <shortUrl>
                const result = await redisClient.sendCommand([
                    'HEXPIRE',
                    'urls',
                    seconds.toString(),
                    'FIELDS',
                    '1',
                    shortUrl,
                ]);
                console.log("Risultato HEXPIRE:", result);
                const vals = await redisClient.hGetAll('urls');
                console.log("Hash prima expire:", vals);

                setTimeout(async () => {
                    const vals = await redisClient.hGetAll('urls');
                    console.log("Hash dopo expire:", vals);
                }, (seconds + 2) * 1000);
            }
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
app.get('/api/:shortUrl', async(req, res) => {
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
                error: "Not an URL",
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

// redirecter
app.get('/:maybeShort', async function (req, res) {
    const shortUrl = req.params.maybeShort;
    console.log('redirecting:', shortUrl);
    try {
        const exists = await redisClient.hExists("urls", shortUrl);
        if(!exists){
            res.redirect('http://localhost:5173'); //home
        } else {
            // value exists
            const longUrl = await redisClient.hGet("urls", shortUrl);
            console.log('redirecting to:', longUrl);
            res.redirect(longUrl);
        }
        
    } catch (error) {
        console.log('Redirect error:', error);
        res.redirect('http://localhost:5173'); //home
    }
});