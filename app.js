const axios = require('axios');
const yargs = require('yargs');

// Shopify API credentials
const shopifyDomain = 'anatta-test-store.myshopify.com';
const adminToken = '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';

// Parse command line arguments
const argv = yargs.option('name', {
  alias: 'n',
  description: 'Product name to search for',
  type: 'string',
  demandOption: true
}).help().alias('help', 'h').argv;

const productName = argv.name;

// Shopify GraphQL query to get products by name
const fetchProductsQuery = (name) => `
{
  products(first: 10, query: "title:*${name}*") {
    edges {
      node {
        title
        variants(first: 10) {
          edges {
            node {
              title
              price
            }
          }
        }
      }
    }
  }
}`;

async function fetchProductsByName(name) {
  const url = `https://${shopifyDomain}/admin/api/2023-10/graphql.json`;
  
  try {
    const response = await axios.post(
      url,
      {
        query: fetchProductsQuery(name),
      },
      {
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.products.edges;
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    return [];
  }
}

function displayVariants(product) {
  const variants = product.node.variants.edges
    .map(edge => ({
      title: edge.node.title,
      price: parseFloat(edge.node.price),
    }))
    .sort((a, b) => a.price - b.price);

  variants.forEach(variant => {
    console.log(`${product.node.title} - ${variant.title} - price $${variant.price}`);
  });
}

(async () => {
  const products = await fetchProductsByName(productName);

  if (products.length === 0) {
    console.log(`No products found for "${productName}".`);
    return;
  }

  products.forEach(displayVariants);
})();
