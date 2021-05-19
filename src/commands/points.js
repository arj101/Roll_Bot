const Discord = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

async function pointsCommand(interaction, points, client) {
  await client.api.interactions(interaction.id, interaction.token).callback.post({data: {
    type: 5,
  }});

  const guildId = interaction.guild_id;
  const authorId = interaction.member.user.id;
  const memberName = interaction.member.nick 
    || interaction.member.user.username;
  const discriminator = interaction.member.user.discriminator;

  const avatarURL = 
    `https://cdn.discordapp.com/avatars/${authorId}/${interaction.member.user.avatar}.png`;

  const message = await client.api.webhooks(client.user.id, interaction.token).messages('@original').get();

  const user = await client.users.fetch(authorId);
  
  const status = user.presence.status;

  // await new Discord.WebhookClient(client.user.id, interaction.token)
  //   .editMessage(message, 'eee', {
  //     files: [{
  //       attachment: await createRankCard(guildId, authorId, memberName, avatarURL, discriminator, status, points),
  //       name: 'rank_card.png'
  //     }]
  // });

  new Discord.WebhookClient(client.user.id, interaction.token)
    .editMessage(message, "I'll be so happy if this works!1!1!");

}

async function createRankCard(
  guildId,
  authorId,
  memberName,
  avatarURL,
  discriminator,
  status,
  points
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
  ctx.fillText(discriminator, 502, 172 + fontHeight);

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


module.exports = {pointsCommand};