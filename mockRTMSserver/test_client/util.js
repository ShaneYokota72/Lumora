// This function is used to make a function call to the server
const functionCall = async ({ messageType, data, from, to }) => {
    try {
        if(!messageType || !data || !from || !to) {
            throw new Error("Missing function call parameters");
        }
        const res = await fetch("http://localhost:3000/api/lumora-function-call", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messageType,
                from,
                to,
                data,
            }),
        });

        if(!res.ok) {
            throw new Error("Function call failed");
        }

        console.log('object added', messageType, data, from, to);
        return await res.json();
    } catch (error) {
        console.error("WebSocket server error:", error);
    }
}

module.exports = functionCall;