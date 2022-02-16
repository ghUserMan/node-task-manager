const express = require('express')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('./db/mongoose') // по месту подключаем содержимое файла

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT 


// без строки ниже почему не работает простое перекладыванеи запроса в ответ
app.use(express.json()) 

app.use(userRouter)
app.use(taskRouter)

//==================================================== START EXPRESS

// Запуск сервера на прослушивание порта
app.listen(port, () => {
    console.log('Server is up on port', port)
})
