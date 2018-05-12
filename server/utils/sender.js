// TODO 仅发送数据
export function sendData(ctx, status = 200, data, type = 'application/json') {
  ctx.response.status = status;
  ctx.response.body = data;
  if (type) {
    ctx.response.type = type;
  }
}
