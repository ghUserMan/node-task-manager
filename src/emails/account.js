const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({ // собственно отправка
        to: email,
        from: 'apatiy.kirov@yandex.ru',
        subject: `${name} welcome to app`,
        text: 'Теперь можно пользовться всякими записками.'
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({ // собственно отправка
        to: email,
        from: 'apatiy.kirov@yandex.ru',
        subject: `${name} goodbye from app`,
        text: 'see you next time'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}

