const express = require('express')
const multer  = require('multer')
const sharp = require('sharp');

const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account') 

const router = new express.Router()

router.get("/users", async (req, res) => {

    try {
        const users = await User.find({})
        res.send(users)
    } catch (e) {
        res.status(500).send(e) // проблема чисто на стороне сервера 
    }
})

router.get("/users/me", auth, async (req, res) => { // ручка чтобы посомтреть свой профиль. инфа по себе буде тв токене

    try {
        res.send(req.user) // потому что его  проставили в хендлере
    } catch (e) {
        res.status(500).send(e) // проблема чисто на стороне сервера 
    }
})

// обновлять тоже только себя
router.patch('/users/me', auth, async (req, res) => {

    // ручная валидация, наверно есть какая-то би
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'password', 'email', 'age']

    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        res.status(400).send({error: 'Invalid operation'})
    }

    // не обновляет не существующие параметры, игнорирует и 200
    try {

        // обновялем в объекте то что пришло с фронта
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        // и таки сохраняем
        await req.user.save()

        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// дабы работал с auth, и не мог удалить другого убрали id  из запроса
// теперь удалить можно токьо самого себя
router.delete('/users/me', auth, async (req, res) => {
    try {

        await req.user.remove()
        sendGoodbyeEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// Когда функция опмечается async, она начинает возвращать промис
router.post("/users", async (req, res) => {

    try {
        const user = new User(req.body)
        sendWelcomeEmail(user.email, user.name) // эта штука асинхронная, но смысла ждать нет
        const token = await user.generateAuthToken() // генерация токена для юзера (настраивается за счёт моделей монгуза)
        res.status(201).send({user, token}) // fifilth - пятно
    } catch (e) {
        res.status(400).send('Error' + e) //  можно написать в две строки 
    }
})

// ручка для входа
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password) // это тоже настроено в моделе
        const token = await user.generateAuthToken() // генерация токена для юзера (настраивается за счёт моделей монгуза)
        res.send({user, token}) // короткая запись, на выходе {user: user, token:token} причём юзер - объект, т.е. {user: {user}, token:token}
        // res.send({user : user.getPublicProfile(), token}) // короткая запись, на выходе {user: user, token:token} причём юзер - объект, т.е. {user: {user}, token:token}
    } catch (e) { // добавился ^ ещё один метод в модель
        // console.log(e)
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        }) // после фильтрации отсеется токен по которому вошли, остальные останутся
        // конкретно из него вышли!
        await req.user.save() // схоронили обновление
        res.send()
    } catch(e) {
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [] // вход из всего
        await req.user.save() // схоронили обновление
        res.send()
    } catch(e) {
        res.status(500).send(e)
    }
})

const upload = multer({  // отсюда будет использоваться промежуточное ПО
    // dest: 'avatars', // при удалении больше не сохраняем, а получаем в запросе
    limits: {
        fileSize: 1000000 // 1Mb
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must be jpg|jpeg|png....'))
        }

        cb(undefined, true)
    }
})

// загрузка аватара пользователя
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer)
                            .resize({width: 250, height: 250})
                            .png()
                            .toBuffer()

    // req.user.avatar = req.file.buffer // есть доступ к файлу так, кладём его в юзера
    req.user.avatar = buffer
    try {
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
}, (error, req, res, next) => {
    return res.status(400).send({error: error.message})

})

// удаление аватара пользователя
router.delete('/users/me/avatar', auth, async (req, res) => {

    try {
        req.user.avatar = undefined // стереть аватар
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }

})

router.get('/users/:id/avatar', async (req, res) => {
    try {

        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        // установка заголовка
        res.set('Content-Type', 'image/png') 
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send(e)
    }
})

module.exports = router