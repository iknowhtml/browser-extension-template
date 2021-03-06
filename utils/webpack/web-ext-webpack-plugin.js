'use strict';

const path = require('path');
const webExt = require('web-ext').default;
require('regenerator-runtime/runtime');

const pluginName = 'WebExtWebpackPlugin';

class WebExtWebpackPlugin {
  constructor({
    sourceDir = path.resolve('dist'),
    artifactsDir,
    browserConsole = true,
    firefox,
    firefoxProfile,
    startUrl,
    target,
  } = {}) {
    this.runner = null;
    this.watchMode = false;
    this.artifactsDir = artifactsDir;
    (this.browserConsole = browserConsole), (this.firefox = firefox);
    this.firefoxProfile = firefoxProfile;
    this.sourceDir = sourceDir;
    this.startUrl = startUrl;
    this.target = target;
  }

  apply(compiler) {
    //eslint-disable-next-line no-unused-vars
    const watchRun = async compiler => {
      this.watchMode = true;
    };
    //eslint-disable-next-line no-unused-vars
    const afterEmit = async compilation => {
      try {
        await webExt.cmd.lint(
          {
            artifactsDir: this.artifactsDir,
            boring: false,
            metadata: false,
            output: 'text',
            pretty: false,
            sourceDir: this.sourceDir,
            verbose: false,
            warningsAsErrors: true,
          },
          {
            shouldExitProgram: false,
          }
        );

        if (!this.watchMode) {
          return;
        }

        if (this.runner) {
          this.runner.reloadAllExtensions();
          return;
        }

        await webExt.cmd
          .run(
            {
              artifactsDir: this.artifactsDir,
              browserConsole: this.browserConsole,
              sourceDir: this.sourceDir,
              firefox: this.firefox,
              firefoxProfile: this.firefoxProfile,
              startUrl: this.startUrl,
              noReload: true,
              target: this.target,
            },
            {}
          )
          .then(runner => (this.runner = runner));

        if (!this.runner) {
          return;
        }

        this.runner.registerCleanup(() => {
          this.runner = null;
        });
      } catch (err) {
        console.log(err);
      }
    };

    if (compiler.hooks) {
      compiler.hooks.afterEmit.tapPromise({ name: pluginName }, afterEmit);
      compiler.hooks.watchRun.tapPromise({ name: pluginName }, watchRun);
    } else {
      compiler.plugin('afterEmit', afterEmit);
      compiler.plugin('watchRun', watchRun);
    }
  }
}

module.exports = WebExtWebpackPlugin;
