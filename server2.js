const axios = require('axios');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL = "http://20.244.56.144/test/companies";
const COMPANIES = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
const TOKEN = process.env.TOKEN;

let allProducts = []; // Store products to be used for detail fetching

app.get('/categories/:categoryname/products', async (req, res) => {
    const categoryname = req.params.categoryname;
    const topN = parseInt(req.query.top) || 10;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
    const sortBy = req.query.sortBy || 'price';
    const sortOrder = req.query.sortOrder || 'asc';
    const page = parseInt(req.query.page) || 1;

    allProducts = [];

    try {
        for (const company of COMPANIES) {
            try {
                console.log(`Fetching products from ${company}...`);
                const response = await axios.get(`${BASE_URL}/${company}/categories/${categoryname}/products`, {
                    params: {
                        top: topN,
                        minPrice: minPrice,
                        maxPrice: maxPrice
                    },
                    headers: {
                        Authorization: `Bearer ${TOKEN}`
                    }
                });
                console.log(`Received products from ${company}:`, response.data);
                const products = response.data.map(product => ({
                    ...product,
                    uniqueId: product.id, // Adjust according to actual response structure
                    company: company
                }));
                allProducts = allProducts.concat(products);
            } catch (error) {
                console.error(`Error fetching products from ${company}:`, error.message);
                // Handle specific error codes
                if (error.response && error.response.status === 401) {
                    return res.status(401).json({ error: `Unauthorized: Failed to fetch products from ${company}` });
                }
            }
        }

        // Sort products
        allProducts.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortBy] - b[sortBy];
            } else {
                return b[sortBy] - a[sortBy];
            }
        });

        // Pagination
        const startIndex = (page - 1) * topN;
        const endIndex = startIndex + topN;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        console.log('Returning paginated products:', paginatedProducts);
        res.json(paginatedProducts);
    } catch (error) {
        console.error('Error in main try-catch:', error.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/categories/:categoryname/products/:productid', (req, res) => {
    const productid = req.params.productid;

    console.log('Searching for product ID:', productid);
    const product = allProducts.find(p => p.uniqueId === productid);

    if (!product) {
        console.error('Product not found for ID:', productid);
        return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product found:', product);
    res.json(product);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
