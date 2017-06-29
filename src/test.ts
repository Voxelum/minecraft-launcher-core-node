import { MojangRepository } from './download'

let r = new MojangRepository()
r.fetchVersionList((re) => {
    if (re instanceof Error) {
        console.log(re)
    } else {
        let latest = re.latest.release
        for (let v of re.versions) {
            if (v.id == latest) {
                console.log(v)
                v.url
            }
        }
    }
})