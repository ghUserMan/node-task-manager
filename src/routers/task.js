const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post("/tasks", auth, async (req, res) => {

    try {
        const task = new Task({
            ...req.body, // синтаксис ES6 для копирования всех полей что пришли в запросе + хардкод
            owner: req.user._id
        })

        const result = await task.save()
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send('Error' + e) //  можно написать в две строки 
    }

})

// GET /tasks/?completed=[true/false/]
// GET /tasks/?limit=10?=&skip=0 // сколько штук получить и сколько пропустить
// GET /tasks/?sortBy=createdAt:asc (поле и порядок сортировки)
router.get("/tasks", auth, async (req, res) => {
    
    const match = {}

    if (req.query.completed) { // работает для true и false потому что в этот момент там строка 
        match.completed = req.query.completed  === 'true'
    } // а else не нужно 

    const sort = {}
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'asc' ? 1 : -1
    }

    try {
        // const tasks = await Task.find({owner: req.user._id}) // конкретного пользователя
        // res.send(tasks)

        //есть альтернативный вариант через populate() который разбирали в примере прошлого урока
        // как по мне - меньше проозрачности
        // однако именно так решили доставать с фильтрацией в обучалке 
        await req.user.populate({ // меянем на объект для фильтрации
            path: 'tasks',
            match, // привет короткая форма записи
            options: { // добавляем ещё опции к запросу, удобно, а дальше само
                limit: parseInt(req.query.limit), // если придёт пустота  - будет проигнорирован
                skip: parseInt(req.query.skip),
                sort 
            }
        }) 
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e) // проблема  на стороне сервера 
    }

})

// запрос параметризованный через адресную строку (route parameter :id)
router.get("/tasks/:id", auth, async (req, res) => {

    const _id = req.params.id.trim()

    try {
        // const task = await Task.findById(_id)

        // будем хитро доставать таск, ну почти, просто убеждаемся что пользвоатель с нами
        const task = await Task.findOne({_id, owner: req.user._id })

        if (!task) {
            return res.status(404).send() // ничего не найдено
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e) // проблема  на стороне сервера 
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    
    const _id = req.params.id.trim()

    // ручная валидация, наверно есть какая-то библиотека
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => { 
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        res.status(400).send({error: 'Invalid operation'})
    }

    // не обновляет не существующие параметры, игнорирует и 200
    try {

        const task = await Task.findOne({_id, owner: req.user._id})
        // const task = await Task.findById(req.params.id)

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }

})

// запрос параметризованный через адресную строку (route parameter :id)
router.delete("/tasks/:id", auth, async (req, res) => {

    try {
        const _id = req.params.id.trim()
        const task = await Task.findOneAndDelete({_id, owner: req.user._id})
        if (!task) {
            return res.status(404).send() // ничего не найдено
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e) // проблема  на стороне сервера 
    }

})


module.exports = router