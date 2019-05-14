const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { getOptions } = require('loader-utils');
const validateOptions = require('schema-utils');
const rimraf = promisify(require('rimraf'));
const protocGrpcWebPluginPath = require('protoc-gen-grpc-web');
const execa = require('execa');
const { rollup } = require('rollup');
const commonjsPlugin = require('rollup-plugin-commonjs');

const mkdtemp = promisify(fs.mkdtemp);

const exe_ext = process.platform === 'win32' ? '.exe' : '';

const grpcToolsDir = path.join(path.dirname(require.resolve('grpc-tools')), 'bin');
const protoc = path.join(grpcToolsDir, 'protoc' + exe_ext);

const tmpdirPrefix = path.join(os.tmpdir(), 'webpack-grpc-web-loader-');
const createTmpdir = () => mkdtemp(tmpdirPrefix);

const optionsSchema = {
  type: 'object',
  properties: {
    protoPath: {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      ],
    },
  },
  required: ['protoPath'],
  additionalProperties: false,
};

module.exports = async function webpackGrpcWebLoader (content) {
  const options = getOptions(this);

  validateOptions(optionsSchema, options, 'GRPC Web Loader');

  const callback = this.async();

  const tmpdir = await createTmpdir();

  const { stdout, stderr } = await execa(protoc, [
    ...(
      Array.isArray(options.protoPath) ?
        options.protoPath.map(protoPath => `-I=${protoPath}`) :
        [`-I=${options.protoPath}`]
    ),
    `--plugin=protoc-gen-grpc-web=${protocGrpcWebPluginPath}`,
    `--js_out=import_style=commonjs:${tmpdir}`,
    `--grpc-web_out=import_style=commonjs,mode=grpcwebtext:${tmpdir}`,
    this.resourcePath,
  ]);

  if (stderr) {
    this.emitError(stderr);
  } else {
    const generatedFileName = path.parse(this.resourcePath).base.replace(/\.[^/.]+$/, '') + '_grpc_web_pb.js';

    const rollupInputConfig = {
      input: path.resolve(tmpdir, generatedFileName),
      external: [
        'grpc-web',
        'google-protobuf',
      ],
      plugins: [
        commonjsPlugin(),
      ],
    };
    const bundle = await rollup(rollupInputConfig);
    const { output } = await bundle.generate({
      format: 'es',
      sourcemap: false,
    });
    const { code } = output[0];

    await rimraf(tmpdir);

    callback(null, code);
  }
}
