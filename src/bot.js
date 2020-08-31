const Discord = require('discord.js');
const firebase = require('firebase');
const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
// const createRankCard = require(path.join(__dirname,'./createRankCard.js'));
require('dotenv').config({ path: path.join(__dirname,'/../.env') });

const app = express();

const port = 3000;

app.get("/", (req, res) => {
  console.log(`I GOT PINGED: (REQUEST HEADER) = ${req.get('user-agent')}`);
  res.send('Welcome');
});

app.listen(port, () => {
  console.log(`Success! Your application is running on port ${port}.`);
});

registerFont(path.join(__dirname, '/../fonts/Ubuntu-Regular.ttf'), {
  family: 'Ubuntu Regular',
});

registerFont(path.join(__dirname, '/../fonts/TwitterColorEmoji-SVGinOT.ttf'), {
  family: 'Twitter Color Emoji',
});

const firebaseConfig = {
  apiKey: process.env.FIERBASE_API_KEY_ROLL_BOT,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.FIERBASE_MESSAGE_SENDER_ID_ROLL_BOT,
  appId: process.env.FIREBASE_APP_ID_ROLL_BOT,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID_ROLL_BOT,
};

firebase.initializeApp(firebaseConfig);

firebase
  .auth()
  .signInAnonymously()
  .catch(function (error) {
    console.log('error while authenticating anonymously');
    console.log(error);
  })
  .then(function () {
    console.log('Anonymously signed in succesfully to firebase');
  });

const database = firebase.database();
const client = new Discord.Client();
const points = {};
const prefix = '%';
const embedColor = '#004CFF';
const newPointsMap = {};

client.on('ready', () => {
  client.user.setActivity(`%help | prefix: ${prefix}`, { type: 'WATCHING' });
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  try {
    await handleMessage(msg);
  } catch(errr) {
    console.log('ERROR FROM FUNCTION handleMessage, \n' + errr);
     try {
      let message_sent = await msg.channel.send(`:x: ${errr.toString().slice(0,200)}`)

      setTimeout(function() {
        message_sent.delete()
        .then(msg => console.log(`Deleted error message sent to guild channel ${message_sent.channel.name} in guild ${message_sent.guild.name}`))
        .catch(console.error);
      } , 30000)

    } catch(errr) {
      console.log('ERROR SENDING ERROR MESSAGE :/');
      console.log(errr);
    }

  }
});



setInterval(function () {
  for (const guild in newPointsMap) {
    for (const member in newPointsMap[guild]) {
      let point = newPointsMap[guild][member];
      point.addPoints();//never change the order or else it wont work!
      point.uploadPoints();//first add points, second upload points
    }
    newPointsMap[guild] = {};
  }
}, 30000);

client.login(process.env.ROLL_BOT_TOKEN);

class PointMap {
  constructor(point, guildId, authorId) {
    this.point = point;
    this.guildId = guildId;
    this.authorId = authorId;
  }

  uploadPoints() {
    database.ref(`${this.guildId}/${this.authorId}`).set({
      points: points[this.guildId][this.authorId].points,
    });
  }

  addPoints() {
    if (!points[this.guildId][this.authorId])
      points[this.guildId][this.authorId] = {};
    if (!points[this.guildId][this.authorId].points) {
      points[this.guildId][this.authorId].points = this.point;
    } else {
      points[this.guildId][this.authorId].points += this.point;
    }
  }
}

async function handleMessage(msg) {
  if (!msg.author.bot) {
    let guildId = msg.guild.id;
    let authorId = msg.author.id;

    if (!points[guildId]) {
      points[guildId] = {};
      let _ = await loadServerSettings(guildId);
      console.log('result:   ' + _);
    }

    if (!points[guildId][authorId]) {
      console.log('loading data from database...');
      let point_snap = await database
        .ref(guildId + '/' + authorId)
        .once('value');
      let point_database = point_snap.val();
      if (point_database) {
        if (!isNaN(point_database.points)) {
          points[guildId][authorId] = {
            points: parseInt(point_database.points),
          };
        }
      }

      console.log('Done');
    }

    if (!newPointsMap[guildId]) {
      newPointsMap[guildId] = {};
    }

    if (!points[guildId].settings) points[guildId].settings = {};

     if (!points[guildId][authorId])
        points[guildId][authorId] = {points:0};


    if (msg.content.toLowerCase().startsWith(`${prefix}points`)) {


      let words = msg.content.split(' ').filter((word) => word.length >= 1);
      let author = msg.author.id;

      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        if (points[guildId].settings.commands) {
          if (points[guildId].settings.commands.channel) {
            if (msg.channel.id != points[guildId].settings.commands.channel) {
              msg.reply(
                'To check points go to <#' +
                  points[guildId].settings.commands.channel +
                  '>'
              );
              return;
            }
          }
        }
      }



      let mention = msg.mentions.members.first()

      if (mention != undefined) {
       
        
          if (!points[guildId][mention.user.id]) {
            console.log('loading data from database...');
            let point_snap = await database
              .ref(guildId + '/' + mention.user.id)
              .once('value');
            let point_database = point_snap.val();
            if (point_database) {
              if (!isNaN(point_database.points)) {
                points[guildId][mention.user.id] = {
                  points: parseInt(point_database.points),
                };
              }
            }

            console.log('Done');
          }
          
        
          
          if (!points[guildId][mention.user.id]) {
            msg.channel.send(
              `\`${mention.displayName}\` doesn't have any Daily dose points :(`
            );
            return;
          }

          msg.channel.send({
            files: [
              await createRankCard(
                guildId,
                mention.user.id,
                mention.displayName,
                mention.user.displayAvatarURL({ format: 'png' }),
                mention.user.tag.slice(
                  mention.user.tag.length - 5,
                  mention.user.tag.length
                )
              ),
            ],
          });

          return;
        
      }
    

      if (points[guildId][authorId]) {
        msg.channel.send({
          files: [
            await createRankCard(
              guildId,
              authorId,
              msg.member.displayName,
              msg.author.displayAvatarURL({ format: 'png' }),
              msg.member.user.tag.slice(
                msg.member.user.tag.length - 5,
                msg.member.user.tag.length
              )
            ),
          ],
        });
      } else {
        msg.reply(`You don't have any Daily dose points :(`);
      }
    } else if (msg.content.startsWith(`${prefix}addRole`)) {
      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        msg.reply('You need to be an administrator to add a new role.');
        return;
      }

      let words = msg.content
        .split(/['"”“]+/)
        .filter((word) => word.length >= 1);

      let role_word = words[1].trim();
      let points_word = words[2].trim();

      if (isNaN(points_word)) {
        msg.reply('minimum point is not a valid number');
        return;
      }

      let role = msg.guild.roles.cache.find((role) => role.name == role_word);

      if (!role) {
        msg.reply(
          'Invalid role. The role you entered was not found in this server! 🤔'
        );
        return;
      }

      if (!points[guildId].settings) {
        points[guildId].settings = {};
      }

      if (!points[guildId].settings.roles) {
        points[guildId].settings.roles = {};
      }

      points[guildId].settings.roles[role_word] = { points: points_word };

      database.ref(`${guildId}/settings/roles/${role_word}`).set({
        points: points_word,
      });

      msg.channel.send(
        `Succesfully added role ${role_word} and set minimum points to ${points_word}`
      );
    } else if (msg.content.toLowerCase().startsWith(`${prefix}setchannel`)) {
      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        msg.reply('You need to be an administrator to use this command. :(');
        return;
      }


      let channel = msg.mentions.channels.first();
      

      if (channel) {
        if (!points[guildId].settings.messaging)
          points[guildId].settings.messaging = {};

        points[guildId].settings.messaging.channel = channel.id;
      } else {
        msg.channel.send(`Please give a valid channel!\nexample: %setChannel <#${msg.channel.id}>`);

        return;
      }

      try{
       await database.ref(`${guildId}/settings/messaging/`).set({
        channel: channel.id,
      });
      }catch(err){
        console.log(err)
        msg.channel.send(`Error while setting commands channel to <#${channel.id}>`)
      }

      msg.channel.send(`Succesfully set commands channel to <#${channel.id}>`);


    } else if (msg.content.startsWith(`${prefix}setCommandChannel`)) {
      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        msg.reply('You need to be an administrator to use this command. :(');
        return;
      }
      let words = msg.content.split(' ').filter((word) => word.length >= 1);
      let channel_name = words[1];

      channel_name = channel_name.slice(2, channel_name.length - 1);

      let channel = await msg.client.channels.fetch(channel_name);

      if (channel) {
        if (!points[guildId].settings.commands)
          points[guildId].settings.commands = {};

        points[guildId].settings.commands.channel = channel_name;
      } else {
        msg.reply('Please give a valid channel!');
      }

      database.ref(`${guildId}/settings/commands`).set({
        channel: channel_name,
      });
    } else if (msg.content.toLowerCase() == `${prefix}roles`) {
      if (!points[guildId].settings) return;
      if (!points[guildId].settings.roles) {
        msg.channel.send('Oops, no roles were found! :thinking:');
        return;
      }

      let roleEmbed = new Discord.MessageEmbed()
        .setColor(embedColor)
        .setTitle('Roles');

      let rolesKeys = Object.keys(points[guildId].settings.roles);

      for (let roleKey in rolesKeys) {
        roleEmbed.addField(
          `\`${rolesKeys[roleKey]}\``,
          `Points required: ${
            points[guildId].settings.roles[rolesKeys[roleKey]].points
          }`
        );
      }

      msg.channel.send(roleEmbed);
    }
     else if (msg.content.toLowerCase() == `${prefix}help`) {
      let help_embed = new Discord.MessageEmbed()
        .setColor(embedColor)
        .setTitle('All of my commands :ok_hand:')
        .addFields(
          { name: '\u200B', value: '\u200B' },
          { name: '`help`', value: 'Send this message ' },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`points <ping server member  here(optional)>`',
            value:
              'Show how much Daily dose points you have! If you pinged a server member, shows their point',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`addRole \'<Role name here>\' <Points here>`',
            value:
              'Set a role to be added to a member when they reach a certain number of points!',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`setChannel <channel>`',
            value: 'Sets the channel to send rank up messages.',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`roles`',
            value: 'Sends a message with info about each role',
          },
          { name: '\u200B', value: '\u200B' }
        )
        .setFooter('Prefix: %');

      msg.channel.send(help_embed);
    } else {
      if (msg.content.length <= 1) return;
      if (msg.content.toLowerCase() === "lol") return;

      let prev_point = points[guildId][authorId].points;
      let randomNum = undefined;
      let newPoint = undefined;
      
      if (!newPointsMap[guildId][authorId]) {

        randomNum =  Math.floor(Math.random() * 10 + 1)

        newPoint = points[guildId][authorId].points + randomNum;

      }else{
        return;
      }

      if (!points[guildId].settings) {
        return;
      }
      if (!points[guildId].settings.roles) {
        return;
      }

      let roles_key = Object.keys(points[guildId].settings.roles);

      for (let key in roles_key) {
        let min_pt = parseInt(
          points[guildId].settings.roles[roles_key[key]].points
        );

        if (min_pt) {
          if (
            min_pt > prev_point &&
            min_pt <= newPoint
          ) {
            let channel;

            if (!points[guildId].settings.messaging)
              points[guildId].settings.messaging = {};

            if (points[guildId].settings.messaging.channel) {
              channel = await msg.client.channels.fetch(
                points[guildId].settings.messaging.channel
              );
            } else {
              channel = msg.channel;
            }

            points[guildId][authorId].points = newPoint;

            channel.send(
              `<@${authorId}> You levelled up! \nYour new tier is.... ${roles_key[key]} :tada:`
            );

            Object.keys(points[guildId].settings.roles).forEach((role_name) => {
              let role = msg.guild.roles.cache.find(
                (role_temp) => role_temp.name == role_name
              );

              if (role) {
                msg.member.roles.remove(role);
              }
            });

            let role = msg.guild.roles.cache.find(
              (role) => role.name == roles_key[key]
            );

            if (!role) {
              msg.reply('Invalid role. Can\'t find the role to give you! 🤔');
            } else {
              msg.member.roles.add(role);
            }
          }
        }
      }


        newPointsMap[guildId][authorId] = new PointMap(
          randomNum,
          guildId,
          authorId
        );

    }
  }
}

function loadServerSettings(guildId) {
  return new Promise(async (resolve, reject) => {
    let settings_snap = await database.ref(guildId + '/settings').once('value');
    let settings_new = settings_snap.val();
    if (settings_new) {
      points[guildId].settings = settings_new;
      resolve('done');
    } else reject('no settings found in the database');
  });
}

async function createRankCard(
  guildId,
  authorId,
  memberName,
  avatarURL,
  tagName
) {
  const canvas = createCanvas(1516, 492);
  const ctx = canvas.getContext('2d');

  if (!points[guildId][authorId]) {
    console.log('cannot find user info');
    return;
  }

  if (isNaN(points[guildId][authorId].points)) {
    console.log('member point is not a number');
    return;
  }

  let pointsMember = points[guildId][authorId].points;

  let roles = Object.keys(points[guildId].settings.roles);

  let currentRankPoint = -1;
  let currentRank;
  let nextRank;
  let nextRankPoint = Infinity;

  for (let role in roles) {
    let rolePoint = parseInt(
      points[guildId].settings.roles[roles[role]].points
    );

    if (rolePoint > currentRankPoint && rolePoint <= pointsMember) {
      currentRankPoint = rolePoint;
      currentRank = roles[role];
    }
  }

  for (let role in roles) {
    let rolePoint = parseInt(
      points[guildId].settings.roles[roles[role]].points
    );

    if (rolePoint < nextRankPoint && rolePoint > pointsMember) {
      nextRankPoint = rolePoint;

      nextRank = roles[role];
    }
  }

  ctx.font = '30px Ubuntu';

  ctx.beginPath();

  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(25,25,25,1)';
  ctx.fill();

  drawRoudedRectangle(ctx, 60, 54, 1396, 384, 30);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();

  let rankBelowPoint;
  if (currentRankPoint == -1) rankBelowPoint = 0;
  else rankBelowPoint = currentRankPoint;

  let rankAbovePoint = nextRankPoint;

  let rankPointDiff = rankAbovePoint - rankBelowPoint;

  let memberPointrankPointDiff_Diff = pointsMember - rankBelowPoint;

  let pointsRatio = memberPointrankPointDiff_Diff / rankPointDiff;

  if (rankAbovePoint == Infinity) pointsRatio = 1;

  let progressBarWidth = 888 * pointsRatio;

  if (progressBarWidth < 76) progressBarWidth = 76;
 

  drawRoudedRectangle(ctx, 502, 296, 888, 76, 38);
  ctx.fillStyle = 'rgba(38, 38, 38, 1)';
  ctx.fill();

  drawRoudedRectangle(ctx, 502, 296, progressBarWidth, 76, 38);
  ctx.fillStyle = 'rgba(32, 188, 255, 1)';
  ctx.fill();

  let fontHeight = 72;
  ctx.font = `${fontHeight}px Ubuntu Regular , Twitter Color Emoji`;
  ctx.fillText(formatMembername(memberName), 502, 86 + fontHeight);

  let pointsFormatted = formatNumber(pointsMember);

  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fillText(
    pointsFormatted,
    1390 - ctx.measureText(pointsFormatted).width,
    86 + fontHeight
  );

  fontHeight = 34;
  ctx.font = `${fontHeight}px Ubuntu Regular`;
  ctx.fillStyle = 'rgba(100,100,100,0.7)';
  ctx.fillText(tagName, 502, 172 + fontHeight);

  fontHeight = 36;
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.font = `${fontHeight}px Ubuntu Regular`;

  if (currentRankPoint != -1) {
    ctx.fillText(currentRank, 502, 244 + fontHeight);
  }

  if (nextRankPoint != Infinity) {
    let role2 = nextRank;
    ctx.fillText(role2, 1390 - ctx.measureText(role2).width, 244 + fontHeight);
  }

  fontHeight = 24;
  ctx.font = `${fontHeight}px Ubuntu Regular`;
  ctx.fillStyle = 'rgba(0, 148, 255, 1)';
  ctx.fillText('Daily Dose Points', 1204, 168 + fontHeight);

  let image = await loadImage(avatarURL);

  drawRoudedRectangle(ctx, 112, 104, 284, 284, 256);

  ctx.clip();

  ctx.drawImage(image, 112, 104, 284, 284);

  return canvas.toBuffer();
}

function drawRoudedRectangle(context, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
  return context;
}

function formatNumber(num) {
  if (num > 999 && num < 1000000) {

    let numDivided = (num / 1000).toFixed(2);

    if(num >= 100000){
      numDivided = (num/1000).toFixed(1);
    }

    let numFormatted = numDivided + 'K';

    return numFormatted;
  }

  if (num > 999999) {
    let numDivided = (num / 1000000).toFixed(2);

    

    let numFormatted = toString(numDivided) + 'M';
    return numFormatted;
  }

  return num;
}

function formatMembername(name) {
  if (name.length > 17) {
    let nameFormatted = name.slice(0, 15);
    nameFormatted += '...';
    return nameFormatted;
  } else {
    return name;
  }
}
