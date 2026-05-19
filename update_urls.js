const fs = require('fs');

const files = [
  'src/components/ProductCard.tsx',
  'src/pages/Cart.tsx',
  'src/pages/Home.tsx',
  'src/components/Header.tsx',
  'src/pages/ProductDetail.tsx',
  'src/pages/OrderDetail.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let code = fs.readFileSync(f, 'utf8');
    
    // Replace product.id
    code = code.replace(/\/product\/\$\{product\.id\}/g, '/product/${product.slug || product.id}');
    // Replace p.id
    code = code.replace(/\/product\/\$\{p\.id\}/g, '/product/${p.slug || p.id}');
    // Replace item.product.id
    code = code.replace(/\/product\/\$\{item\.product\.id\}/g, '/product/${item.product.slug || item.product.id}');
    // Specifically OrderDetail
    code = code.replace(/\/product\/\$\{item\.product\.id \|\| item\.product_id\}#reviews/g, '/product/${item.product.slug || item.product.id || item.product_id}#reviews');

    fs.writeFileSync(f, code);
  }
});
