const axios = require('axios');

async function main() {
    try {
        const response = await axios.get("http://localhost:8000/api/user/getAllUsers");
        const users = response.data.data || response.data;
        console.log("Found", users.length, "users.");
        const roles = new Set(users.map(u => String(u.role).toLowerCase()));
        console.log("Roles:", Array.from(roles));
        const sample = users.find(u => u.role.toLowerCase() === 'project_manager') || users[0];
        console.log("Sample user:", { id: sample.id || sample._id, firstName: sample.firstName, lastName: sample.lastName, role: sample.role });
    } catch (e) {
        console.error("Error", e.message);
    }
}
main();
