#! /usr/bin/env node

const fs = require("fs-extra"); 
// const fetch = require("node-fetch");

// import fetch from 'node-fetch';

function formatContent(content) {
  try {
    let text = content.split(/<script\b[^>]*>/)[1];
    text = text.replace(
      /options\.player_list\s*\=\s*/,
      // `{"videos":`
      ""
    );
    text = text.replace(
      /\,\s*\];\s?var\s?player\s?=\s?new\s?Video_player\(options\);\s?\<\/script\>/,
      // `]}`
      `]`
    );
    text = text.replaceAll(`'`, `"`);
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function formatAuthor(content) {
  return content
    ? {
        uri: content.uri.$t,
        name: content.name.$t,
        email: content.email.$t,
        photo: content.gd$image.src,
      }
    : null;
}

function formatData(data) {
  return data.feed.entry.map((item) => {
    return {
      categories: item.category.map((item) => item.term),
      title: item.title.$t,
      author: formatAuthor(item.author[0]),
      thumbnail: item.media$thumbnail.url,
      videos: formatContent(item.content.$t),
      createdAt: item.updated.$t,
      updatedAt: new Date().toISOString(),
      publishedAt: item.published.$t,
    };
  });
}

async function main() {
  const chalk = (await import('chalk')).default;
  const fetch = (await import('node-fetch')).default;

  const feedUrl = process.argv[2];
  const dataPath = process.argv[3];

  if (!feedUrl || !dataPath) {
    console.log(chalk.blue(`
        node nodejs-blogger-feeder <feed-url> <json-path>

        Parameters:
        ===========

        - feed-url: (Required) The blogger feed url
        - json-path: (Required) The result as json path

        Example:
        -----
        node nodejs-blogger-feeder http://blogname.blogspot.com/feeds/posts/default?alt=json&max-results=10 ./data.json
    `));
  }

  try {
    
    const data = await fetch(feedUrl).then(res => res.json());
    console.log('data: ', formatData(data));
    fs.writeFile(dataPath, JSON.stringify(formatData(data), null, 2), (err) => {
      if (err) {
        console.log('err: ', err);
      }
      console.log('The file has been saved!');
    });
  } catch (err) {
    console.log('err: ', err);
  }

}

main();