import { sendData } from '../utils';
import { userModel, checkinModel, checkinTokenModel } from '../models';
import { CheckinServ } from '../service';
/**
 * 历史发布签到列表
 * 
 * @export
 * @param {any} ctx 
 */
export async function getCheckinList(ctx) {
	const token = ctx.request.header.token;
	if (!token) {
		sendData(ctx, 401, JSON.stringify({ msg: '请先登陆' }));
		return;
	}
	ctx.token = token;
	sendData(ctx, 200, JSON.stringify(await checkinModel.getCheckinList(ctx.token)));
}

/**
 * 发布签到
 * 
 * @export
 * @param {any} ctx 
 */
export async function launchCheckin(ctx) {
	const token = ctx.request.header.token;
	if (!token) {
		sendData(ctx, 401, JSON.stringify({ msg: '请先登陆' }));
		return;
	}

	ctx.token = token;
	// 检查是否存在正在进行的签到
	if (await CheckinServ.getCheckinIDByToken(ctx.token) !== null) {
		sendData(ctx, 400, JSON.stringify({ msg: '有签到正在进行，发起签到失败' }));
		return;
	}

	const checkin = ctx.request.body;
	const ids = await CheckinServ.set(ctx.token, ctx.request.body.limit_time);
	checkin.checkin_id = ids.checkin_id;
	checkin.token = ctx.token;

	if ((await checkinModel.createCheckin(checkin)).affectedRows === 1) {
		sendData(ctx, 201, JSON.stringify({ share_id: ids.share_id }));
	} else {
		sendData(ctx, 400, JSON.stringify({ msg: '发布签到失败' }));
	}
}

/**
 * 点击结束签到
 * 
 * @export
 * @param {any} ctx 
 */
export async function stopCheckin(ctx) {
	const token = ctx.request.header.token;
	if (!token) {
		sendData(ctx, 401, JSON.stringify({ msg: '请先登陆' }));
		return;
	}

	ctx.token = token;
	// 检查是否存在正在进行的签到
	if (await CheckinServ.getCheckinIDByToken(ctx.token) === null) {
		sendData(ctx, 400, JSON.stringify({ msg: '没有签到正在进行，停止签到失败' }));
		return;
	}

	await CheckinServ.delByToken(ctx.token);

	sendData(ctx, 204);
}

/**
 * 具体每个签到信息
 * 
 * @export
 * @param {any} ctx 
 */
export async function getCheckinInfo(ctx) {
	const token = ctx.request.header.token;
	if (!token) {
		sendData(ctx, 401, JSON.stringify({ msg: '请先登陆' }));
		return;
	}
	ctx.token = token;

	const checkin_id = ctx.params.checkin_id;

	var checkinInfo = { checkedin: await checkinModel.getCheckinInfo(checkin_id) };
	checkinInfo.checkedin_num = checkinInfo.checkedin.length;
	const share_id = await CheckinServ.getShareIDByCheckinID(checkin_id);
	if (share_id) {
		checkinInfo.share_id = share_id;
		checkinInfo.is_on = true;
	} else {
		checkinInfo.share_id = -1;
		checkinInfo.is_on = false;
	}

	const info = await checkinModel.getInfoByCheckinID(checkin_id);
	checkinInfo.title = info.title;
	checkinInfo.datetime = info.datetime;

	sendData(ctx, 200, JSON.stringify(checkinInfo));
}