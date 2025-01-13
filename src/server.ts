import { fastify} from  "fastify";
import { fastifyCors } from "@fastify/cors";

const app = fastify()


app.register(fastifyCors, {
    origin: '*'
})


app.get('/healthCheck', () => {
    return 'OK'
    
})

app.listen({port:3333}).then(() => {
    console.log('HTTP server running on http://localhost:3333')
})