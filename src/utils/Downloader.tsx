import fs from 'fs';

const Axios = require('axios');

export async function download(
  url: string,
  filepath: string,
  progressCallback: (total: number, progress: number) => void
) {
  const writer = fs.createWriteStream(filepath);
  const streamResponse = await Axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  const totalLength = streamResponse.headers['content-length'];

  streamResponse.data.on('data', (chunk: any) =>
    progressCallback(totalLength, chunk.length)
  );
  // Write data
  streamResponse.data.pipe(writer);

  writer.on('finish', () => console.log('Finished'));
  writer.on('error', () => console.error('Error while dowloading image'));
}

export async function upload() {
  console.log('Filler');
}
