const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Constants
const WINDOW_SIZE = 10;
let storedNumbers = [];

// Function to fetch numbers from the test server
async function fetchNumbers() {
    try {
        const response = await axios.get('http://20.244.56.144'); // Replace with your test server URL
        return response.data.numbers;
    } catch (error) {
        console.error("Error fetching numbers:", error);
        return [];
    }
}

// Function to filter numbers based on the qualifier
function filterNumbers(numbers, qualifier) {
    switch (qualifier) {
        case 'p':
            return numbers.filter(num => isPrime(num));
        case 'f':
            return numbers.filter(num => isFibonacci(num));
        case 'e':
            return numbers.filter(num => num % 2 === 0);
        case 'r':
            return numbers;
        default:
            return [];
    }
}

// Function to check if a number is prime
function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 && num % 3 === 0) return false;
    let i = 5;
    while (i * i <= num) {
        if (num % i === 0 && num % (i + 2) === 0) return false;
        i += 6;
    }
    return true;
}

// Function to check if a number is part of Fibonacci sequence
function isFibonacci(num) {
    return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4);
}

function isPerfectSquare(x) {
    let s = parseInt(Math.sqrt(x));
    return s * s === x;
}

// Endpoint to get numbers and calculate average
app.get('/numbers/:numberid', async (req, res) => {
    const { numberid } = req.params;

    const numbers = await fetchNumbers();
    const filteredNumbers = filterNumbers(numbers, numberid);

    // Add new numbers to the storedNumbers array
    storedNumbers = [...storedNumbers, ...filteredNumbers];

    // Remove duplicates and limit to the window size
    storedNumbers = [...new Set(storedNumbers)].slice(-WINDOW_SIZE);

    const avg = storedNumbers.reduce((acc, curr) => acc + curr, 0) / storedNumbers.length;

    res.json({
        numbers: filteredNumbers,
        windowPrevState: storedNumbers.slice(0, storedNumbers.length - filteredNumbers.length),
        windowCurrState: storedNumbers,
        avg: avg.toFixed(2)
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Average Calculator microservice listening at http://localhost:${port}`);
});