import { ServerInfo } from '../src/game'


ServerInfo.fetchServerStatus({ host: 'mc.crafter.me' }, true)
    .then(status => {
        console.log(status.pingToServer)
    })