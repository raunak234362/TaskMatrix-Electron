const axios = require('axios');

async function main() {
    try {
        const response = await axios.get("http://192.168.1.26:5156/v1/user/getAllUsers");
        const users = response.data.data || response.data;
        console.log("Found", users.length, "users.");
        const roles = new Set(users.map(u => String(u.role).toLowerCase()));
        console.log("Roles:", Array.from(roles));
        const siddhi = users.find(u => String(u.firstName).toLowerCase().includes('siddhi'));
        if (siddhi) {
            console.log("Siddhi's user info:", siddhi);
        } else {
            console.log("Siddhi not found. Sample user:", users[0]);
        }
    } catch (e) {
        console.error("Error", e.message);
    }
}
main();
