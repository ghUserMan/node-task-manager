const jwt = require('jsonwebtoken');
const User = require('../models/user')

const auth = async (req, res, next) => {
    console.log('AUTH')

    try {
        const token = req.header('Authorization').replace('Bearer ', '') // заччем сначала добавляли, потмо удаляли?
        // console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // console.log(decoded)
        const user = await User.findOne({_id: decoded._id, 'tokens.token' : token}) // опять не пришлось использвоать new ObjectId 
        // вторая проверка что такой  токен у пользователя есть
        // поэтому используется поиск одного, а не по id

        if (!user) {
            throw new Error()
        }

        // console.log(user)

        req.token = token // тоже на будущее
        req.user = user // засовываем уже найденого пользователя в запрос, чтобы  не искать его ещё раз в хендлере 

        next() 
    } catch (e) {
        res.status(401).send({error: 'Go Auth!'})
    }
}

module.exports = auth