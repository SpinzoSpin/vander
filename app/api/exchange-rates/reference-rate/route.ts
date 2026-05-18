export async function GET(req: Request) {
    try {
        const hdrs = req.headers

        console.log("Headers: ", Array.from(hdrs.entries()))

        const DEFAULT_CURRENCY_RATE = "PHP/USD"

        return new Response(JSON.stringify({ currency: DEFAULT_CURRENCY_RATE }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return new Response("Internal Server Error", { status: 500 })
    }
}