const mongoose = require('mongoose');
const validator = require('validator');
//task-manager-api  - имя базы данных
mongoose.connect(process.env.MONGOBD_URL, {
    useNewUrlParser: true
});
