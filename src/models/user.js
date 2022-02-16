const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// отделили схему от  конструктора для подключения промежуточного ПО
const userSchema = new mongoose.Schema( {
    name: { // а тут кроме типа можем описать валидацию и прочее: mongoose.model('Cat', { name: String });
        type: String,
        required: true,
        trim: true
    },
    email : {
        type: String,
        required: true,
        unique: true, // теперь не может быть двух пользователей с одинаковой почтой. Но для этого потребовалось грохнуть БД с уже существующими записями
        trim: true,
        lowercase: true,
        validate(value) { // так пишется кастомный валидатор, но тут он библиотечный
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6+1, // точно больше 6
        validate(value) { // ES6 method definition syntax
            // if (value.indexOf('password') !== -1) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Too stupid password')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true // как понмиаю смысл этой записи в том что поле обязательное как только оно вообще будет в массиве
            // So if you are going to add a new item into the tokens array, it needs this property right here, I will set required equal to true.
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// сплошная виртуальность, ссылка на добро этого пользователя не хранится в БД, но вот так есть
userSchema.virtual('tasks', {
    ref: 'Task',
    // создаём связь
    localField: '_id',
    foreignField: 'owner'
})

// метод для сокрытия приватных данных
userSchema.methods.getPublicProfile = function () { // похоже это только демонстрация, может быть вызван в роутере
    const user = this
    const userObject = user.toObject()

    delete userObject.password // это возможности монгуза по удалению полей
    delete userObject.tokens

    return userObject
}

// верхниё метод переименован и теперь вызывается автоматически
// работает для всех хендлеров (роутеров)
userSchema.methods.toJSON = function () { // похоже это только демонстрация, может быть вызван в роутере
    const user = this
    const userObject = user.toObject()

    delete userObject.password // это возможности монгуза по удалению полей
    delete userObject.tokens
    delete userObject.avatar // прячем и аватар на ручке инфомрации

    return userObject
}

// доступны на инстансе
// именно такая форма - чтобы был доступ к this
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET) // полезна янагрузка и секрет
    
    user.tokens = user.tokens.concat({token})
    await user.save()
    
    return token
}

// объявляем дополнительный метод на модели (доступны на моделе)
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email}) // короткий синтаксис
    
    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// делаем до для хеширования
// подключаем обычной функцией потому что стрелочная ()=> не умеет в this
userSchema.pre('save', async function(next) {
    const user = this // для понятности

    console.log('Before save!') 
    
    // хешируем пароль
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next() // для завершения асинхронного вызова, иначе повисним
})

// удаление тасков при удалении ползователя
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner : user._id})
    next()
})


// типа заводим конструктор
const User = mongoose.model('User', userSchema)

module.exports = User