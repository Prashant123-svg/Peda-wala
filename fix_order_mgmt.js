const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'components', 'OrderManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Simple line-based fixes
const lines = content.split('\n');
const fixed = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const nextLine = lines[i + 1] || '';
  
  // Skip old localhost lines if next line has API_BASE_URL
  if (line.includes('const profileRes = await axios.get("http://localhost:5000/api/auth/profile"') &&
      nextLine.includes('const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`')) {
    i++; // skip next iteration since we're skipping this line
    fixed.push(nextLine);
    continue;
  }
  if (line.includes('const ordersRes = await axios.get("http://localhost:5000/api/order-status/dashboard-orders"') &&
      nextLine.includes('const ordersRes = await axios.get(`${API_BASE_URL}/order-status/dashboard-orders`')) {
    i++;
    fixed.push(nextLine);
    continue;
  }
  
  // Fix analytics call - if line has old localhost and next has API_BASE_URL, use API_BASE_URL
  if (line.trim().startsWith('"http://localhost:5000/api/order-status/analytics/summary"') &&
      nextLine.trim().startsWith('`${API_BASE_URL}/order-status/analytics/summary`')) {
    fixed.push(lines[i + 1]);
    i++;
    continue;
  }
  
  // Fix deliveryBoys call
  if (line.trim().startsWith('"http://localhost:5000/api/order-status/available-delivery-boys"') &&
      nextLine.trim().startsWith('`${API_BASE_URL}/order-status/available-delivery-boys`')) {
    fixed.push(lines[i + 1]);
    i++;
    continue;
  }
  
  // Fix update-status - if line has old localhost URL and next has API_BASE_URL, keep API_BASE_URL  
  if (line.includes('`http://localhost:5000/api/order-status/update-status/${orderId}`') &&
      nextLine.includes('`${API_BASE_URL}/order-status/update-status/${orderId}`')) {
    fixed.push(nextLine);
    i++;
    continue;
  }
  
  // Fix assign-delivery-boy
  if (line.includes('`http://localhost:5000/api/order-status/assign-delivery-boy/${orderId}`') &&
      nextLine.includes('`${API_BASE_URL}/order-status/assign-delivery-boy/${orderId}`')) {
    fixed.push(nextLine);
    i++;
    continue;
  }
  
  fixed.push(line);
}

const result = fixed.join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log('Fixed OrderManagement.tsx');
