import * as path from 'path'

before(function () {
    this.assets = path.normalize(path.join(__dirname, '..', '..', 'assets'));
    this.gameDirectory = path.join(this.assets, 'temp')
})