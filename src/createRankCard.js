


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

        if(numDivided >= 10){
        numDivided = numDivided.toFixed(1);
        }

        let numFormatted = numDivided + 'K';

        return numFormatted;
    }

    if (num > 999999) {
        let numDivided = (num / 1000000).toFixed(2);

        if(numDivided >= 10){
        numDivided = numDivided.toFixed(1);
        }

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

  
module.exports = createRankCard;