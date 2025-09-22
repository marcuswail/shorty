export function encode(number){
    let base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // we only use these chars to short the URL
    let result = '';

    while (number > 0){
        result = base62[number%62] + result; // we only add a new char pulling it from base62 chars, appending it to the previus one
        number = Math.floor(number/62); // we reduce the number 
    }

    if(result)
        return result;
    else return 0;
}