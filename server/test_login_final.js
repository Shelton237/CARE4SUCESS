import axios from 'axios';

async function testLogin() {
    console.log("Testing login for penlapsaturin@gmail.com on production server...");
    try {
        const response = await axios.post('https://care4success.usra-care.com/api/auth/login', {
            email: 'penlapsaturin@gmail.com',
            password: 'eleve123'
        });
        console.log('SUCCESS: Login validated!');
        console.log('User Name:', response.data.user.name);
        console.log('User Role:', response.data.user.role);
    } catch (error) {
        if (error.response) {
            console.error('FAILED: Login rejected by server.');
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message || "No message provided");
        } else {
            console.error('ERROR: Could not connect to server.', error.message);
        }
    }
}

testLogin();
