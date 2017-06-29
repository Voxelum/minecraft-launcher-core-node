import { MojangRepository } from './download'

let r = new MojangRepository()
r.fetchVersionList((re) => {
    console.log(re)
})