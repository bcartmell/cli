require('shelljs/global')

const TAGS_FOLDER = 'test/tags',
  EXPECTED_FOLDER = 'test/expected',
  GENERATED_FOLDER = 'test/generated',
  cli = require('../../lib')

describe('API methods', function() {

  this.timeout(10000)

  it('help', function* () {
    expect(yield cli.help()).to.be.a('string')
  })

  it('version', function* () {
    expect(yield cli.version()).to.be(`
  riot-cli:      ${require('../../package.json').version} - https://github.com/riot/cli
  riot-compiler: ${require('riot-compiler/package.json').version} - https://github.com/riot/compiler
`)
  })

  it('check', function* () {
    const [check] = yield cli.check({from: `${TAGS_FOLDER}/wrong-component.tag`})

    expect(check).to.be.an('object')
    expect(check.errors).to.have.length(2)
    expect(yield cli.check({from: `${TAGS_FOLDER}/component.tag`})).to.have.length(0)
    expect((yield cli.check({from: `${TAGS_FOLDER}`}))[0].file).to.be.a('string')
  })

  it('make with the wrong path should return an error', function* () {
    try {
      yield cli.make({
        from: 'some/random/path.tag'
      })
      throw 'force error'
    } catch (error) {
      expect(error).to.be.a('string')
      expect(error).to.match(/does not exist/)
    }
  })

  it('make with the right path should not return any error', function* () {
    const error = yield cli.make({
      from: `${TAGS_FOLDER}/component.tag`
    })

    expect(error).to.be(undefined)
  })

  it('make all the tags in a folder', function* () {
    yield cli.make({
      from: 'test/tags', to: `${GENERATED_FOLDER}/make.js`
    })

    // check if the file exists
    expect(test('-e', `${GENERATED_FOLDER}/make.js`)).to.be(true)
  })

  it('make using the modular flag on a single tag must return compliant UMD code', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}/component.tag`,
      to: `${GENERATED_FOLDER}/make-component.js`,
      compiler: { modular: true }
    })

    expect(test('-e', `${GENERATED_FOLDER}/make-component.js`)).to.be(true)
    expect(cat(`${GENERATED_FOLDER}/make-component.js`)).to.match(/require/)

  })

  it('make using the modular flag on multiple tags must return compliant UMD code', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}`,
      to: `${GENERATED_FOLDER}/make-components.js`,
      compiler: { modular: true }
    })

    expect(test('-e', `${GENERATED_FOLDER}/make-components.js`)).to.be(true)
    expect(cat(`${GENERATED_FOLDER}/make-components.js`)).to.match(/require/)
  })

  it('make using the esm flag on a single tag must return compliant esm module code', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}/component.tag`,
      to: `${GENERATED_FOLDER}/make-esm-component.js`,
      compiler: { esm: true }
    })

    expect(test('-e', `${GENERATED_FOLDER}/make-esm-component.js`)).to.be(true)
    expect(cat(`${GENERATED_FOLDER}/make-esm-component.js`)).to.match(/import/)

  })

  it('make using the esm flag on multiple tags must return compliant esm module code', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}`,
      to: `${GENERATED_FOLDER}/make-esm-components.js`,
      compiler: { esm: true }
    })

    expect(test('-e', `${GENERATED_FOLDER}/make-esm-components.js`)).to.be(true)
    expect(cat(`${GENERATED_FOLDER}/make-esm-components.js`)).to.match(/import/)
  })

  it('make using a missing preprocessor should throw an error', function* () {
    try {
      yield cli.make({
        from: `${TAGS_FOLDER}/component.tag`,
        compiler: { modular: true, template: 'nope' }
      })
      throw 'force error'
    } catch (error) {
      expect(error)
      .to
      .be('The "nope" html preprocessor was not found. Have you registered it?')
    }
  })

  it('make using the --export feature', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}/export`,
      to: `${GENERATED_FOLDER}/export/make-tags.html`,
      export: 'html',
      compiler: {
        entities: true
      }
    })
    expect(cat(`${GENERATED_FOLDER}/export/make-tags.html`).toString()).to.be(cat(`${EXPECTED_FOLDER}/export/tags.html`).toString())

    yield cli.make({
      from: `${TAGS_FOLDER}/export`,
      to: `${GENERATED_FOLDER}/export/make-tags.js`,
      export: 'js',
      compiler: {
        entities: true
      }
    })
    expect(cat(`${GENERATED_FOLDER}/export/make-tags.js`).toString()).to.be(cat(`${EXPECTED_FOLDER}/export/tags.js`).toString())

    yield cli.make({
      from: `${TAGS_FOLDER}/export`,
      to: `${GENERATED_FOLDER}/export/make-tags.css`,
      export: 'css',
      compiler: {
        entities: true
      }
    })

    expect(cat(`${GENERATED_FOLDER}/export/make-tags.css`).toString()).to.be(cat(`${EXPECTED_FOLDER}/export/tags.css`).toString())

    yield cli.make({
      from: `${TAGS_FOLDER}/export`,
      to: `${GENERATED_FOLDER}/export/make-tags.scss.css`,
      export: 'css',
      ext: 'html',
      compiler: {
        style: 'sass',
        entities: true
      }
    })

    expect(cat(`${GENERATED_FOLDER}/export/make-tags.scss.css`).toString().replace(/\n/g, '')).to.be(cat(`${EXPECTED_FOLDER}/export/tags.scss.css`).toString().replace(/\n/g, ''))
  })

  it('make using the --exclude flag', function* () {
    yield cli.make({
      from: `${TAGS_FOLDER}/exclude`,
      to: `${GENERATED_FOLDER}/exclude/css.js`,
      compiler: {
        exclude: ['css']
      }
    })
    expect(cat(`${GENERATED_FOLDER}/exclude/css.js`).toString()).to.be(cat(`${EXPECTED_FOLDER}/exclude/css.js`).toString())

    yield cli.make({
      from: `${TAGS_FOLDER}/exclude`,
      to: `${GENERATED_FOLDER}/exclude/css-js.js`,
      compiler: {
        exclude: ['css', 'js']
      }
    })

    expect(cat(`${GENERATED_FOLDER}/exclude/css-js.js`).toString()).to.be(cat(`${EXPECTED_FOLDER}/exclude/css-js.js`).toString())
  })

  it('check the error messages when the parser was not found', function* () {
    try {
      yield cli.make({
        from: `${TAGS_FOLDER}`,
        to: `${GENERATED_FOLDER}`,
        ext: 'tag',
        compiler: {
          type: 'unknown'
        }
      })
      throw 'force error'
    } catch (error) {
      expect(error).to.be.a('string') // error string
      expect(error).to.match(/preprocessor was not found/)
    }
  })

  it('watch folder', function (done) {
    cli.watch({from: TAGS_FOLDER})
    .then(watcher => {
      watcher.on('ready', () => {
        cp(`${TAGS_FOLDER}/component.tag`, `${TAGS_FOLDER}/component-copy.tag`)
        watcher.add(`${TAGS_FOLDER}/component-copy.tag`)
        // hopefully this tag gets compiled after 3 secons
        setTimeout(() => {
          rm(`${TAGS_FOLDER}/component-copy.tag`)
          expect(test('-e', `${TAGS_FOLDER}/component-copy.js`)).to.be(true)
          watcher.close()
          done()
        }, 3000)
      })
    })
  })

  it('watch file', function (done) {
    cli.watch({
      from: `${TAGS_FOLDER}/component.tag`,
      to: `${GENERATED_FOLDER}/watch-component.js`
    }).then(watcher => {
      watcher.on('ready', () => {
        cat(`${TAGS_FOLDER}/component.tag`).to(`${TAGS_FOLDER}/component.tag`)
      })

      watcher.on('change', () => {
        setTimeout(() => {
          expect(test('-e', `${GENERATED_FOLDER}/watch-component.js`)).to.be(true)
          watcher.close()
          done()
        }, 150)
      })
    })
  })

})
