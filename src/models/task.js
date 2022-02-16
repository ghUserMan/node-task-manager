const mongoose = require('mongoose');
const validator = require('validator');
const User = require('./user');

const taskSchema = new mongoose.Schema({
    description : {
        type: String,
        trim: true,
        required: true
    },
    completed : {
        type: Boolean,
        default: false
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId, // особый тип
        required: true,
        ref: 'User' // речеренс чтобы достать объект
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

// чуть не забыл экспортировать
module.exports = Task