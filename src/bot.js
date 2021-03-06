const Discord = require('discord.js');
const firebase = require('firebase');
const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const { pointsCommand } = require('./commands/points.js');
// const createRankCard = require(path.join(__dirname,'./createRankCard.js'));
require('dotenv').config({ path: path.join(__dirname,'/../.env') });

const app = express();

const port = 3000;

app.get("/", (req, res) => {
  console.log(`I GOT PINGED: (REQUEST HEADER) = ${req.get('user-agent')}`);
  res.send(`
The bot is online!!!<br />
Thanks for the ping.<br />
Feel free to ping anytime ;)`);
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

registerFont(path.join(__dirname, '/../fonts/NotoSans-Regular.ttf'), {
  family: 'Noto Sans',
});

registerFont(path.join(__dirname, '/../fonts/NotoSans-Bold.ttf'), {
  family: 'Noto Sans Bold',
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

// client.ws.on('INTERACTION_CREATE', async interaction => {
//   const authorId = interaction.member.user.id;
//   const guildId = interaction.guild_id;

//   if (!points[guildId]) {
//       points[guildId] = {};
//       let _ = await loadServerSettings(guildId);
//       console.log('result:   ' + _);
//     }

//   if (!points[guildId][authorId]) {
//     console.log('loading data from database...');
//     let point_snap = await database
//       .ref(guildId + '/' + authorId)
//       .once('value');
//     let point_database = point_snap.val();
//     if (point_database) {
//       if (!isNaN(point_database.points)) {
//         points[guildId][authorId] = {
//           points: parseInt(point_database.points),
//         };
//       }
//     }

//     console.log('Done');
//   }

//   if (!newPointsMap[guildId]) {
//     newPointsMap[guildId] = {};
//   }

//   if (!points[guildId].settings) points[guildId].settings = {};

//   if (!points[guildId][authorId]) {
//         points[guildId][authorId] = {points:0};
//   }

//   if (interaction.data.name === 'points') {
//       await client.api.interactions(interaction.id, interaction.token).callback.post({data: {
//     type: 5,
//   }});

//   const message = await client.api.webhooks(client.user.id, interaction.token).messages('@original').get();


//   const wb = new Discord.WebhookClient(client.user.id, interaction.token);
//     await wb.editMessage(message, "Why does this work wtf");

//     // await pointsCommand(interaction, points, client);
//   }
// })



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
  if (msg.channel.type === 'dm' || msg.guild === null) return;
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

    if (msg.channel.id === '801492338332401726') {
      let hasImage = false;
      for (const a of msg.attachments) {
        if (a[1].height !== null) {
          hasImage = true;
        }
      }
      if (!hasImage) {
        msg.delete()
      } else {
        msg.react('👍');
        msg.react('👎');
      }

      return;
    }


    if (msg.content.toLowerCase().startsWith(`${prefix}points`) || msg.content.toLowerCase().startsWith(`${prefix}p `) || msg.content.toLowerCase() === `${prefix}p`) {


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



      let mention = msg.mentions.members.first();

    

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
                ),
                mention.user.presence.status
              ),
            ],
          });

          return;
      }
        
      let ids = msg.content.split(' ').filter((word) => word.length === 18);
      let members = [];

      for (const id of ids) {
        let member = await msg.guild.members.fetch(id).catch(() => {});
        if (member != undefined) {
          members.push(member)
        }
      }

      if (members.length > 0) {

        if (members.length > 3) {
          members = members.slice(0, 3);
        }

        for (const member of members) {
          

           if (!points[guildId][member.user.id]) {
            console.log('loading data from database...');
            let point_snap = await database
              .ref(guildId + '/' + member.user.id)
              .once('value');
            let point_database = point_snap.val();
            if (point_database) {
              if (!isNaN(point_database.points)) {
                points[guildId][member.user.id] = {
                  points: parseInt(point_database.points),
                };
              }
            }

          }
          
        
          
          if (!points[guildId][member.user.id]) {
            msg.channel.send(
              `\`${member.displayName}\` doesn't have any Daily dose points :(`
            );
          } else {
              msg.channel.send({
              files: [
                await createRankCard(
                  guildId,
                  member.user.id,
                  member.displayName,
                  member.user.displayAvatarURL({ format: 'png' }),
                  member.user.tag.slice(
                    member.user.tag.length - 5,
                    member.user.tag.length
                  ),
                member.user.presence.status
                ),
              ],
            });
          }
        }
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
              ),
              msg.member.user.presence.status
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
        id: role.id
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


    } 
     else if (msg.content.startsWith(`${prefix}setCommandChannel`)) {
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

      rolesKeys.sort(function(a, b) {
        return points[guildId].settings.roles[a].points -
        points[guildId].settings.roles[b].points
      });
      
      for (let roleKey in rolesKeys) {
        roleEmbed.addField(
          `\`${rolesKeys[roleKey]}\``,
          `Points required: ${
            points[guildId].settings.roles[rolesKeys[roleKey]].points
          }`
        );
      }

      msg.channel.send(roleEmbed);
    } else if (msg.content.toLowerCase().startsWith(`${prefix}removerole`)) {
      if (!msg.member.hasPermission('ADMINISTRATOR')) {
        msg.reply('You need to be an administrator to use this command. :(');
        return;
      }
      let msg_arr = msg.content.split(' ');
      msg_arr.shift();
      let role_name = msg_arr.join(' ');

      if (!role_name) {
        msg.channel.send("Please provide a valid role name.");
        return;
      }

    
      if (!points[guildId].settings.roles[role_name]) {
        msg.channel.send(`Role '${role_name}' is not used for ranking.`);
        return;
      }

      database.ref(`${guildId}/settings/roles/${role_name}`).remove();

      points[guildId].settings = loadServerSettings(guildId);

      msg.channel.send('Done!');
    }
     else if (msg.content.toLowerCase() == `${prefix}help`) {
      let help_embed = new Discord.MessageEmbed()
        .setColor(embedColor)
        .setTitle('Help')
        .addFields(
          { name: '\u200B', value: '\u200B' },
          { name: '`help`', value: 'I think its quite obvious...' },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`points <ping server member  here(optional)>`',
            value:
              'Shows your/who you mention points.',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`addRole \'<Role name here>\' <Points here>`',
            value:
              'Add a role to the ranking system.',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`setChannel <channel>`',
            value: 'Set rank-up message channel..',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: '`roles`',
            value: 'If you wanna know more about the roles.',
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

        randomNum =  Math.floor(Math.random() * 10 + 1);
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
              `<@${authorId}> You levelled up! \nYour new tier is... ${roles_key[key]} :tada:`
            );

            Object.keys(points[guildId].settings.roles).forEach((role_name) => {
              let role = msg.guild.roles.cache.find(
                (role_temp) => role_temp.id == points[guildId].settings.roles[role_name].id
              );

              if (role) {
                msg.member.roles.remove(role);
              }
            });

            let role = msg.guild.roles.cache.find(
              (role) => role.id == points[guildId].settings.roles[roles_key[key]].id
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
  tagName,
  status
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

  ctx.font = '30px Noto Sans';

  ctx.beginPath();

  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(40, 46, 51, 1)';
  ctx.fill();

  let rankBelowPoint;
  if (currentRankPoint == -1) rankBelowPoint = 0;
  else rankBelowPoint = currentRankPoint;

  let rankAbovePoint = nextRankPoint;

  let rankPointDiff = rankAbovePoint - rankBelowPoint;

  let memberPointrankPointDiff_Diff = pointsMember - rankBelowPoint;

  let pointsRatio = memberPointrankPointDiff_Diff / rankPointDiff;

  if (rankAbovePoint == Infinity) pointsRatio = 1;

  let progressBarWidth = 914 * pointsRatio;

  if (progressBarWidth < 76) progressBarWidth = 76;
 

  drawRoudedRectangle(ctx, 502, 316, 914, 76, 38);
  ctx.fillStyle = 'rgba(54, 60, 66, 1)';
  ctx.fill();

  drawRoudedRectangle(ctx, 502, 316, progressBarWidth, 76, 38);
  ctx.fillStyle = 'rgba(255, 16, 73, 1)';
  ctx.fill();


  let pointsFormatted = formatNumber(pointsMember);

  let fontHeight = 96;

  ctx.font = `${fontHeight}px Noto Sans`;
  ctx.fillStyle = 'rgba(255, 16, 73, 1)';
  ctx.fillText(
    pointsFormatted,
    1416 - ctx.measureText(pointsFormatted).width,
    57 + fontHeight
  );

  let pointsWidth = ctx.measureText(pointsFormatted).width;

  let formatedMemberName = memberName;


  fontHeight = 64;
  ctx.font = `${fontHeight}px Noto Sans, Twitter Color Emoji`;
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';

  if (ctx.measureText(formatedMemberName).width + 502 > 1416 - pointsWidth - 100) {
    while (ctx.measureText(formatedMemberName).width + 502 > 1416 - pointsWidth - 100) {
      formatedMemberName = formatedMemberName.slice(0, formatedMemberName.length - 1);
    }

    formatedMemberName = formatedMemberName.trim() + '...';
  }

  ctx.fillText(formatedMemberName, 502, 79 + fontHeight);

  fontHeight = 36;
  ctx.font = `${fontHeight}px Noto Sans`;
  ctx.fillStyle = 'rgba(175,175, 175, 1)';
  ctx.fillText(tagName, 502, 172 + fontHeight);

  fontHeight = 36;
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.font = `${fontHeight}px Noto Sans`;

 
  if (nextRankPoint != Infinity) {
    let role2 = nextRank;
    ctx.fillText(role2, 1416 - ctx.measureText(role2).width, 258 + fontHeight);

    if (currentRankPoint != -1 ) {
      ctx.fillText(currentRank, 502, 258 + fontHeight);
    } 
  } else if (currentRankPoint != -1) {
    fontHeight = 64;
    ctx.font = `${fontHeight}px Noto Sans Bold`;
    ctx.fillText(currentRank, 958.5 - (ctx.measureText(currentRank).width /2 ), 310 + fontHeight);
  } 


  fontHeight = 36;
  ctx.font = `${fontHeight}px Noto Sans`;
  ctx.fillStyle = 'rgba(175, 175, 175, 1)';
  ctx.fillText('Daily Dose Points', 1129, 172 + fontHeight);

  let image = await loadImage(avatarURL);

  drawRoudedRectangle(ctx, 71, 71, 350, 350, 175);
  drawRoudedStrokeRectangle(ctx, 71, 71, 350, 350, 175, "rgba(255, 255, 255, 1)");
  
  ctx.save();
  ctx.clip();
  ctx.drawImage(image, 71, 71, 350, 350);
  ctx.restore();

  drawRoudedStrokeRectangle(ctx, 366, 322, 50, 50, 25, "rgba(255, 255, 255, 1)");

  let color = "rgba(58, 224, 0, 1)";

  switch (status) {
    case 'online':
      color = "rgba(58, 224, 0, 1)";
      break;
    case 'idle':
      color = "rgba(255, 92, 0, 1)";
      break;
    case 'dnd':
      color = "rgba(255, 16, 73, 1)";
      break;
    case 'offline':
      color = "rgba(175, 175, 175, 1)";
      break;
  }

  drawRoudedRectangle(ctx, 366, 322, 50, 50, 25);
  ctx.fillStyle = color;
  ctx.fill();

  return canvas.toBuffer();
}

//maybe later
// function createWelcomeCard(username) {
//   const canvas = createCanvas(640, 240);
//   const ctx = canvas.getContext('2d');

//   ctx.font = '30px Ubuntu';
//   ctx.beginPath();

//   drawRoudedRectangle(ctx, 20, 20, 600, 200, 10);
//   ctx.fillStyle = 'rgba(253, 71, 71, 1)';
//   ctx.fill();

//   username = 'Arduino Explorer#5896'

//   const fontHeight = 42;
//   ctx.font = `${fontHeight}px Gochi Hand , Noto Sans Twitter Color Emoji`;
//   ctx.fillStyle = 'rgba(255, 255, 255, 1)';
//   ctx.fillText(username, 320 - (ctx.measureText(username).width/2), 120);


//   return canvas.toBuffer();
// }

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

function drawRoudedStrokeRectangle(context, x, y, w, h, r, rgba) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  context.beginPath();
  context.lineWidth = "5";
  context.strokeStyle = rgba;
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.stroke();
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
  if (name.length > 14) {
    let nameFormatted = name.slice(0, 13);
    nameFormatted += '...';
    return nameFormatted;
  } else {
    return name;
  }
}



function getRoleById(guild, id) {
 let role = guild.roles.cache.find(
                (role_temp) => role_temp.id == id
  );

  return role;
}

function getMemberById(guild, id) {
  let member = "idk"

  console.log(client.guilds.cache)

  return member;
}