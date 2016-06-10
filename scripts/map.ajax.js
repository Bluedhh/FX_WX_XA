/**
 * Created by LiMing on 15/9/20.
 */
/*global $ AMap JSSHA*/
'use strict';
/**
 * 全局变量区域
 */
var position,             //存储位置的数组[116,39]
	type = 'hRain',          //加载地图类型,默认为aqi
	pause = true,             //地图开始播放, 1为停止
	imageIndex = 0,         //图片数组的索引
	oldmapLayer,
	newmapLayer,
	preImageUrl,
	interval = 0,             //图片的刷新速度
	changeHandler,             //播放的handler
	toolbar = null,             //为了操作toolbar 把他放在全局
	menuSwitch = false,
	markSwitch = true,
	toolSwitch = true,
	images = [],              //用于存储所有的图片地址以及图片配置信息
	times = [],
	timeLine,
	clicked = true,
	opacity = 0,
	cb = $('.colorBoard'),
	groundLayers = [];
/**
 * 全局配置区
 * @type {{defaultZoom: number, apiHost: string, imageListUrl: string}}
 */
var config = {
	defaultZoom: 4,
	center: [108.94, 34.347],
	changeSpeed: 1200,
	updateDuring: 800,
	restartDuring: 1e3,
	imagesOpacity: 0.5,
	positionShiftFix: [0, 0],
	pointDataDays: 7,
	displayPicsNo: 10,
	emptyImg: 'img/empty/wcloud_empty.PNG',
	apiHost: 'http://120.132.57.114',
	imageListUrl: 'http://120.132.57.114/metadata',
	hackUrl: 'http://120.132.57.114/tentative',//?type=rain 是降水接口
	hackPm25: 'http://caiyunapp.com/res/storm_radar/pm25/',
	pointDataUrl: 'http://120.132.57.114/pdata',
	privateHttp: 'http://openapi.mlogcn.com:8000/api/',
	appid: '11106b9bb2114016880576a5719893ee',
	appkey: '482fdc53c5f14dfd98cbb44f778e81be'
};
var map = new AMap.Map('mapContainer', {
	resizeEnable: true,
	level: window.innerWidth < 420 ? 3 : config.defaultZoom,
	center: [108.94, 34.347]
});
var marker = new AMap.Marker({
	map: map,
	icon: new AMap.Icon({
		image: './images/pin_fc.png',
		imageSize: new AMap.Size(25, 34)
	}),
	offset: new AMap.Pixel(-13, -35),
	zIndex: 150,
	draggable: false
});
/**
 * 工具集, 更加抽象化以后,做成tools.min.js
 * @type {{zeroPad: Function, toUTCtimeString: Function, timestampTotimeString: Function, mapRecenter: Function, addDate: Function, sprintf: Function, fixRain: Function, fixWind: Function, fixWeat: Function, getThisData: Function, weatherAjax: Function}}
 */
var tools = {
	trace: function() {
		//console.log(arguments[0]);
	},
	zeroPad: function (n, width) {
		return new Array(Math.max(width - n.toString().length, 0) + 1).join('0') + n.toString();
	},
	toTimeString: function (date) {
		return date.getUTCFullYear() +
			tools.zeroPad(date.getUTCMonth() + 1, 2) +
			tools.zeroPad(date.getUTCDate(), 2) +
			tools.zeroPad(date.getUTCHours(), 2) +
			tools.zeroPad(date.getMinutes(), 2);
	},
	toLocaltimeString: function (date) {
		return date.getFullYear() +
			tools.zeroPad(date.getMonth() + 1, 2) +
			tools.zeroPad(date.getDate(), 2) +
			tools.zeroPad(date.getHours(), 2) +
			tools.zeroPad(date.getMinutes(), 2);
	},
	timestampTotimeString: function (timestamp) {
		var date = new Date(timestamp);
		return (
		tools.zeroPad(date.getUTCDate(), 2) +
		tools.zeroPad(date.getUTCHours(), 2));
	},
	buildPrivateKey: function (appid, appkey) {
		var timeStamp = new Date().getTime();
		var shaObj = new JSSHA('SHA-1', 'TEXT');
		shaObj.setHMACKey(appkey, 'TEXT');
		shaObj.update(timeStamp + appid);
		//var time = tools.toLocaltimeString(new Date()).substr(0, 8);
		var key = encodeURIComponent(shaObj.getHMAC('B64')).replace(/%20/g, '+');
		//var url = 'http://openapi.mlogcn.com:8000/api/air/fc/coor/' + lon + '/' + lat + '/d/' + time + '/' + time + '.json?appid=' + appid + '&timestamp=' + timeStamp + '&key=' + key;
		return {
			stamp: timeStamp,
			token: key
		};
	},
	mapRecenter: function (e, a) {
		var pos = new AMap.LngLat(e.lng, e.lat);
		map.panTo(pos);
		//console.log('mapCenter--------------');
		var offsetX = a[0],
			offsetY = a[1];
		map.panBy(offsetX, offsetY);
		//setTimeout(map.panBy(offsetX, offsetY), 500);
	},
	sprintf: function () {
		var t = arguments, e = t[0] || '', a = 1;
		for (var i = t.length; i > a; a++) {
			e = e.replace(/%s/, t[a]);
		}
		return e;
	},
	fixRain: function (value) {
		return value === 0 ? 0 : (value + '<br>mm');
	},
	fixWind: function (value) {
		return value === 0 ? 0 : (value + '<br>km/h');
	},
	fixWeat: function (value) {
		return value === 0 ? 0 : (value + '%');
	},
	weatherAjax: function (url, right, wrong) {
		$.ajax({
			url: url,
			type: 'get',
			dataType: 'json',
			contentType: 'application/x-www-form-urlencoded;charset=utf-8',
			success: right,
			error: wrong
		});
	},
	browser: function(){
		if(navigator.userAgent.match(/(iPhone|ios)/i)){
			$('.time').css({'top': -11, 'height': 3});
		} else if(navigator.userAgent.match(/(Android)/i)) {
			$('.time').css({'top': -9, 'height': 3});
			if(navigator.userAgent.indexOf('UC') < 0 && navigator.userAgent.indexOf('QQ') < 0){
				$('.phoneAddress').css('height', 220);
			}
		}
	},
	isFirst: function(){
		//读取cookie
		if(!/www.mlogcn.com/.test(document.cookie)) {
			$('.tip').fadeIn().delay(5000).fadeOut();
		}
		//写入cookie
		var expiresTime = new Date();
		expiresTime.setDate(expiresTime.getDate() + 60);
		document.cookie = 'name=www.mlogcn.com;expires=' + expiresTime;
	}
};
/**
 * 气象云核心代码, 数据,模型与视图混杂,应该在新版本中进行分离
 * @type {{shownImage: Function, changeImages: Function, start: Function, stop: Function, updateImages: Function, requestImages: Function, placeMarker: Function, getAddress: Function, updatePanelData: Function, forwordByStep: Function, backwordByStep: Function}}
 */
var mlogMap = {
	mapUserPosition: function () {
		AMap.service(['AMap.CitySearch'], function () {
			var citysearch = new AMap.CitySearch();
			citysearch.getLocalCity(function (status, result) {
				if (status === 'complete' && result.info === 'OK') {
					if (result && result.city && result.bounds) {
						//console.log(window.innerWidth);
						//map.setBounds(result.bounds);
						if(window.innerWidth < 420) {
							map.panBy(0, -$('.infoPanel').outerHeight() / 2);
						}
						position = new AMap.LngLat((result.bounds.northeast.lng + result.bounds.southwest.lng) / 2, (result.bounds.northeast.lat + result.bounds.southwest.lat) / 2);
					}
				} else {
					//console.log('error');
					position = new AMap.LngLat(config.center[0], config.center[1]);
				}
				mlogMap.placeMarker(map);
			});
		});
	},
	/**
	 * 将imageIndex所指向的图片显示出来,其他图片隐藏
	 */
	shownImage: function () {
		var $time = $('.time');
		if (type === 'hRain' || type === 'fRain') {
			$time.css({'width': imageIndex * 8.333 + '%'});
		} else if (type === 'aqi') {
			if (imageIndex < 25) {
				$time.css({'width': imageIndex * 0.6944444444444 + '%'});
			} else {
				$time.css({'width': (imageIndex - 24 + 1) * 24 * 0.6944444444444 + '%'});
			}
		}
		newmapLayer = groundLayers[imageIndex];
		if (typeof newmapLayer !== 'undefined') {
			newmapLayer.setOpacity(type === 'hRain' ? opacity : config.imagesOpacity);//todo need check
			if (typeof oldmapLayer !== 'undefined') {
				oldmapLayer.setOpacity(0);
			}
			oldmapLayer = newmapLayer;
		}
	},
	changeImages: function () {
		imageIndex++;
		interval = config.changeSpeed;
		//是否已经运行到最后,回到开始
		if (imageIndex > images.length) {
			imageIndex = 0;
			//$('.time').css({'width': '0%'});
			$('.time').css('width', 0);
		}
		//gray = 1 - imageIndex / images.length;
		opacity = 0.5;
		mlogMap.shownImage();

		changeHandler = setTimeout(function () {
			mlogMap.changeImages();
		}, interval);
	},
	start: function () {
		mlogMap.changeImages();
		$('#play').removeClass('icon-mlogfont-play').addClass('icon-mlogfont-pause');
		pause = false;
	},
	stop: function () {
		if (typeof changeHandler !== 'undefined') {
			clearTimeout(changeHandler);
		}
		$('#play').removeClass('icon-mlogfont-pause').addClass('icon-mlogfont-play');
		pause = true;
	},
	updateImages: function () {
		var imageUrl = images[images.length - 1][0];
		if (images.length > 0 && imageUrl !== '' && preImageUrl !== imageUrl) {
			for (var i = 0; i < groundLayers.length; i++) {
				groundLayers[i].setMap(null);
			}
			groundLayers.length = 0;
			timeLine = '';
			var image, bound, newLayer,
				rainLen = 12,
				aqiLen = 29,//todo
				LEN = ((type === 'hRain' || type === 'fRain') ? rainLen : aqiLen),
				timelineLen = ((type === 'hRain' || type === 'fRain') ? 12 : 6);
			var TIME_INTERVAL = 10;
			var aqiLocalTime = '',
				aqiShortTimeStamp = '';
			for (var j = 0; j < LEN; j++) {
				image = images[j][0];
				//console.log(images);
				bound = new AMap.Bounds(new AMap.LngLat(images[j][2][0].minlon, images[j][2][0].minlat), new AMap.LngLat(images[j][2][0].maxlon, images[j][2][0].maxlat));
				newLayer = new AMap.GroundImage(image, bound, {map: map, clickable: true});
				newLayer.setOpacity(0);
				newLayer.setMap(map);
				groundLayers.push(newLayer);
			}
			for (var k = 0; k < timelineLen; k++) {
				if (type === 'hRain') {
					times[k] = (110 - TIME_INTERVAL * k + '分钟前');
				} else if (type === 'fRain') {
					times[k] = (TIME_INTERVAL * (k + 1) + '分钟后');
				} else if (type === 'aqi') {
					aqiLocalTime = new Date(new Date().getTime() + k * 1000 * 3600 * 24);//todo
					aqiShortTimeStamp = tools.toLocaltimeString(aqiLocalTime).substr(4, 2) + '/' + tools.toLocaltimeString(aqiLocalTime).substr(6, 2) + '平均';
					times[k] = aqiShortTimeStamp;
					times[0] = '未来24小时';
				}
				timeLine += '<div class="timeline_day"><span class="time_interval">' + times[k] + '</span></div>';
			}
			//console.log(times);
			$('.day_list').html(timeLine);
			if (type === 'hRain' || type === 'fRain') {
				$('.l_header_play').hide();
				$('.dubangguo').show();
				$('.time_interval').addClass('evenTimeInterval');
				$('.timeline_day').css('width', '8.333%');
			} else if (type === 'aqi') {
				$('.l_header_play').show();
				$('.dubangguo').hide();
				$('.timeline_day').css('width', '16.667%');
			}
			preImageUrl = imageUrl;
			mlogMap.start();
		}
	},
	requestImages: function () {
		images = [];
		var requestUrl = '';
		var rain2hoursAgo = tools.toLocaltimeString(new Date($.now() - 2 * 3600 * 1000)),
			rainNow = tools.toLocaltimeString(new Date()),
			rain2hoursLater = tools.toLocaltimeString(new Date($.now() + 2 * 3600 * 1000));
		//console.log(tools.toLocaltimeString(new Date()));
		if (type === 'hRain') {
			if (map.getZoom() >= 8) {
				//console.log('====================单站====================');
				requestUrl = 'http://120.132.57.114/meteimg/singleradar?type=rdrain&starttime=' + rain2hoursAgo + '&endtime=' + rainNow + '&timetype=4&lat=' + map.getCenter().lat + '&lon=' + map.getCenter().lng;
			} else {
				//console.log('====================全国====================');
				requestUrl = 'http://120.132.57.114/meteimg/realtime?starttime=' + rain2hoursAgo + '&endtime=' + rainNow + '&timetype=4&type=rdrain';
			}
		} else if (type === 'fRain') {
			if (map.getZoom() >= 8) {//todo
				requestUrl = 'http://120.132.57.114/meteimg/singleradar?type=rdfrain&starttime=' + rainNow + '&endtime=' + rain2hoursLater + '&timetype=4&lat=' + map.getCenter().lat + '&lon=' + map.getCenter().lng;
			} else {
				requestUrl = 'http://120.132.57.114/meteimg/forecast?starttime=' + rainNow + '&endtime=' + rain2hoursLater + '&timetype=4&type=rdfrain';

			}
		} else if (type === 'aqi') {
			var aqiStart = tools.toLocaltimeString(new Date()).slice(0, 10) + '00';
			var aqiEnd = tools.toLocaltimeString(new Date($.now() + 5 * 24 * 3600 * 1000)).slice(0, 8) + '2359';
			requestUrl = 'http://120.132.57.114/meteimg/forecast?starttime=' + aqiStart + '&endtime=' + aqiEnd + '&timetype=4&type=aqi';
			//'http://120.132.57.114/metadata?timestamp=2016011117&type=aqi';
			//'http://120.132.57.114/wcbd/meteimg/forecast?starttime=201601111700&endtime=201601162359&timetype=4&type=aqi';
			//'http://120.132.57.114/wcbd/meteimg/forecast?starttime=' + aqiStart + '&endtime=' + aqiEnd + '&timetype=4&type=aqi';
		}
		//console.log(requestUrl);
		$.ajax({
			url: requestUrl,
			ifModified: true,
			success: function (res) {
				var ret = $.parseJSON(res);
				var imageList = ret.series;
				if(imageList.length === 0 && map.getZoom() < 8) {
					//console.log('=============服务器正在努力为您运算，请稍候加载查看============');
					$('.error').show();
					$('.l_header_play').hide();
				} else if(imageList.length === 0 && map.getZoom() >= 8) {
					var emptyStr = $.now() + ':' + config.emptyImg;
					for (var empty = 0; empty < 12; empty++) {
						imageList.push(emptyStr);
					}
				}
				//console.log(imageList);
				if (imageList.length > 0) {
					$('.error').hide();
					config.displayPicsNo = (type === 'aqi' ? 29 : 12);
					//var imagesLen = 12;//Math.min(config.displayPicsNo, imageList.length);
					if (type === 'hRain' || type === 'fRain') {
						$('.l_header_play').hide();
						var timeArray = [],
							start = $.now();
						var imgListTime = [];
						for (var a = 12; a >= 0; a--) {
							timeArray[a] = start;
							start -= 600000;//600000是10分钟
							//console.log(tools.toLocaltimeString(new Date(timeArray[a])));
						}
						var timeArrayLen = timeArray.length,
							imgLen = imageList.length;
						for (var d = 0; d < imgLen; d++) {
							imgListTime[d] = parseInt(imageList[d].split(':')[0]);
							//console.log(tools.toLocaltimeString(new Date(imgListTime[d])));
						}
						var imageDiff = 0;
						if (imgLen < 12) {
							//console.log((timeArray[timeArrayLen - 1] - imgListTime[imgLen - 1]) / 900000);
							if ((timeArray[timeArrayLen - 1] - imgListTime[imgLen - 1]) / 900000 >= 1) {
								//console.log('最后补进来一张');
								imageList.push(imageList[imgLen - 1]);
							}
							if (imageList.length < 12 && (imgListTime[0] - timeArray[0]) / 900000 >= 1) {
								//console.log('开始补进来一张');
								imageList.push(imageList[0]);
							}
							if(imageList.length < 12) {//重新写入后的imageList不能使用imgLen
								//console.log('中间补进来N张');
								var randomNum = Math.round(Math.random() * (imageList.length - 1));//产生一个0～imageList.length - 1之内的随机数
								imageDiff = 12 - imageList.length;
								for (var b = 0; b < imageDiff; b++) {
									imageList.push(imageList[randomNum]);
								}
							}
							imageList = imageList.sort();
							//console.log(imageList);
						} else if (imgLen > 12) {
							imageDiff = imageList.length - 12;
							var bImg = false,
								bImgPlusOne = false;
							for (var m = 0; m < timeArrayLen && imageDiff > 0; m++) {
								bImg = timeArray[m] < imgListTime[m] && imgListTime[m] < timeArray[m + 1];
								bImgPlusOne = timeArray[m] < imgListTime[m + 1] && imgListTime[m + 1] < timeArray[m + 1];
								if (bImg && bImgPlusOne) {
									imageList = imageList.slice(0, m + 1).concat(imageList.slice(m + 2, imgLen));
									imageDiff--;
								}
							}
						}
						for (var i = 0; i < config.displayPicsNo; i++) {
							images.push([config.apiHost + '/' + imageList[i].split(':')[1], imageList[i].split(':')[0], ret.bbox]);
						}
						//console.log(images);
					} else if (type === 'aqi') {
						$('.l_header_play').show();
						//var front = 24 - (parseInt(tools.toLocaltimeString(new Date()).substr(8, 2)) + 1);
						var front = 24 - (parseInt(tools.toLocaltimeString(new Date()).substr(8, 2)));
						//console.log(front);
						var aqiArr = imageList.slice(0, front).concat(imageList.slice(front + 1, 25));//拼接前24小时
						for (var f = 0; f < 5; f++) {//images里已经有24张，还剩后5天平均值的图
							if(imageList[front + 25 * (f + 1)]) {
								aqiArr.push(imageList[front + 25 * (f + 1)]);//每天有25张图
							} else {
								aqiArr.push(aqiArr[aqiArr.length - 1]);
							}
						}
						if(imageList.length < 29) {
							for(var k = 0, lack = 29 - imageList.length; k < lack; k++) {
								aqiArr.push(aqiArr[imageList.length - 1]);
							}
						}
						//console.log(aqiArr);
						for (var j = 0; j < config.displayPicsNo; j++) {
							//images.push([config.apiHost + '/' + aqiArr[j].img, aqiArr[j].timestamp, ret.bbox]);
							images.push([config.apiHost + '/' + aqiArr[j].split(':')[1], aqiArr[j].split(':')[0], ret.bbox]);
						}
					}
					//console.log(images);
					mlogMap.updateImages();
				}
			}
		});
		$('#mask').hide();
	},
	getNewAddress: function () {
		var lnglatXY = [position.lng, position.lat];
		var MGeocoder;
		//加载地理编码插件
		AMap.service(['AMap.Geocoder'], function () {
			MGeocoder = new AMap.Geocoder({
				radius: 1000,
				extensions: 'all'
			});
			//逆地理编码
			MGeocoder.getAddress(lnglatXY, function (status, result) {
				if (status === 'complete' && result.info === 'OK') {
					var changeCity = result.regeocode.formattedAddress;
					$('.allCityName').html(changeCity);
					if(window.innerWidth < 420) {
						changeCity = changeCity.length < 10 ? changeCity : changeCity.substring(0, 10) + '...';
					} else {
						changeCity = changeCity.length < 10 ? changeCity : changeCity.substring(0, 10) + '...';
					}
					//console.log(result.regeocode.formattedAddress);
					mlogMap.updatePanelData(changeCity);
				}
			});
		});
	},
	handleRainData: function (data) {
		var len = data.length,
			LITTLERAINLENGTH = 2.5,
			MIDDLERAINLENGTH = 5.5,
			LARGERAINLENGTH = 13.5,
			VERYLARGERAINLENGTH = 97.5;
		for (var i = 0; i < len; i++) {
			if (data[i] > 2.5 && data[i] <= 8) {
				data[i] = (data[i] - 2.5) / MIDDLERAINLENGTH * LITTLERAINLENGTH + LITTLERAINLENGTH;
			} else if (data[i] > 8 && data[i] <= 16) {
				data[i] = (data[i] - 2.5) / LARGERAINLENGTH * LITTLERAINLENGTH + LITTLERAINLENGTH * 2;
			} else if (data[i] > 16 && data[i] <= 100) {
				data[i] = (data[i] - 2.5) / VERYLARGERAINLENGTH * LITTLERAINLENGTH + LITTLERAINLENGTH * 3;
			} else if (data[i] > 100) {
				data[i] = 9.9;
			}
		}
	},
	updatePanelData: function (changeCity) {
		//console.log('hehe==========================');
		var privateKey = tools.buildPrivateKey(config.appid, config.appkey);
		var count = 2,
			hour2 = null,
			aqi = null,
			air = null,
			cur = null;
		//console.log(position);
		var allDataSuccess = function () {
			count--;
			//console.log('allDataSuccess');
			var chartWidth = 300,
				color = '#068894';
			if (window.innerWidth < 420) {//移动端
				$('.icon-mlogfont-search').on('click', function () {
					//console.log(window.innerWidth);
					$('.phoneAddress').slideDown();
				});
				chartWidth = 360;
				color = '#2899E6';
			}
			if (!count) {
				var opt = {
					colors: [color],
					title: {
						text: changeCity,
						x: -15
					},
					legend: {
						enabled: false
					},
					credits: {
						text: null
					},
					exporting: {
						enabled: false
					},
					plotOptions: {
						spline: {
							lineWidth: 1.5,
							fillOpacity: 0.1,
							marker: {
								enabled: false,
								states: {
									hover: {
										enabled: true,
										radius: 1
									}
								}
							},
							shadow: false
						},
						areaspline: {
							lineWidth: 1.5,
							marker: {
								enabled: false,
								states: {
									hover: {
										enabled: true,
										radius: 1
									}
								}
							},
							shadow: false
						}
					}
				};
				if (type === 'hRain' || type === 'fRain') {
					var rainSubTitle = '';
					var rData = [];
					if(!hour2.errorCode) {
						rainSubTitle = hour2.msg;
						var mData = hour2.series;
						//console.log(typeof mData);
						if (mData.length) {
							for (var i = 0; i < 121; i += 10) {
								if (mData[i] === 'undefined' || mData[i] === 'null' || typeof mData === 'string' || mData.length === 0 ) {//换了新接口有时mData='[]'
									rData.push(null);
								} else {
									rData.push(mData[i]);
								}
							}
							mlogMap.handleRainData(rData);
						} else {
							rData = [null, null, null, null, null, null, null, null, null, null, null, null, null];
						}
						//console.log(rData);

						var snowOrRain = {};
						if(/雪/.test(hour2.msg)) {
							snowOrRain = {
								yAxis: {
									plotBands: [{
										label: {text: '小雪'}
									}, {
										label: {text: '中雪'}
									}, {
										label: {text: '大雪'}
									}, {
										label: {text: '暴雪'}
									}]
								}
							};
						}
					} else {
						rainSubTitle = '该地区暂无数据';
						rData = [null, null, null, null, null, null, null, null, null, null, null, null, null];
					}

					var rDataLen = rData.length || 13;
					var rainTime = [];
					for (var a = 0; a < rDataLen; a++) {
						var rainTimeStr = tools.toLocaltimeString(new Date($.now() + 600000 * a));
						if (a % 2 === 0) {
							rainTime.push(null);
						} else {
							rainTime.push(rainTimeStr.substr(8, 2) + ':' + rainTimeStr.substr(10, 2));
						}
					}
					var rainSettings = {
						series: [{
							name: '降水',
							data: rData
						}],
						chart: {
							type: 'areaspline',
							backgroundColor: null,
							height: 222,
							width: chartWidth
						},
						subtitle: {
							text: rainSubTitle,
							align: 'center',
							x: -15,
							style: {
								color: color
							}
						},
						xAxis: {
							labels: {
								style: {color: '#000000'},
								step: 1,//步长，每隔n个显示一次
								formatter: function () {
									return rainTime[this.value];
								}
							},
							tickInterval: 1,
							tickmarkPlacement: 'on',//设置刻度线位于在类别名称的中心
							tickLength: 3,//设置刻度线的长度
							lineColor: color,
							tickColor: color,
							//tickPosition: 'inside',//刻度线在轴的内部
							title: {style: {color: '#000000'}}
						},
						yAxis: {
							gridLineColor: '#DDDDDD',
							gridLineDashStyle: 'ShortDot',
							tickPositions: [0, 2.5, 5, 7.5, 10],
							minPadding: 0,
							startOnTick: false,
							labels: {
								formatter: function () {
									return null;
								},
								style: {color: '#000000'}
							},
							title: {text: null},
							plotBands: [{
								from: 0,
								to: 2.5,
								label: {text: '小雨', style: {color: '#777777'}},
								zIndex: 999
							}, {
								from: 2.5,
								to: 5,
								label: {text: '中雨', style: {color: '#777777'}},
								zIndex: 999
							}, {
								from: 5,
								to: 7.5,
								label: {text: '大雨', style: {color: '#777777'}},
								zIndex: 999
							}, {
								from: 7.5,
								to: 10,
								label: {text: '暴雨', style: {color: '#777777'}},
								zIndex: 999
							}]
						},
						tooltip: {
							enabled: false,
							headerFormat: '时间：<br>',
							valueSuffix: 'mm/h',
							pointFormat: '{series.name}：{point.y}',
							backgroundColor: 'rgba(0, 0, 0, 0.2)',
							borderWidth: 0,
							shadow: false,
							style: {
								color: 'rgba(0, 0, 0, 0.8)',
								fontSize: '12px',
								fontWeight: 'normal'
							}
						}
					};
					$('#rainChart').highcharts($.extend(true, {}, opt, rainSettings, snowOrRain));
					$('.average').hide();
					$('.current').show();
					/*当前信息*/
					if(cur === null) {
						$('#temp_now').html('暂无数据');
						$('#wind_num').html('/');
						$('#wind_dir').html('');
						$('#hum_num').html('/');
						$('#aqi_cur_num').html('');
						$('#aqi_cur_desc').html('/');
					} else {
						$('#temp_now').html('温度: ' + cur.tmp + '°C');
						$('#wind_num').html(cur.wd);
						$('#wind_dir').html(cur.wdg + '级');
						$('#hum_num').html(cur.rh + '%');
						$('#aqi_cur_num').html(cur.aqi);
						$('#aqi_cur_desc').html(cur.tip_aqi);
					}
				} else if (type === 'aqi') {
					var aqiLen = aqi.length,
						aData = [];
					for (var j = 0; j < aqiLen; j += 2) {
						aData.push(aqi[j].aqi);
					}
					var dataLen = aData.length,
						aqiTime = [];
					for (var b = 0; b < dataLen; b++) {
						aqiTime.push(tools.toLocaltimeString(new Date($.now() + 7200000 * b)).substr(8, 2) + '时');
					}
					var aqiSubTitle = typeof aqi === 'string' || aqi.length === 0 ? '该地区暂无数据' : '未来24小时空气质量预报';
					var aqiSettings = {
						chart: {
							type: 'spline',
							backgroundColor: null,
							height: 222,
							width: chartWidth
						},
						series: [{
							name: '空气质量',
							data: aData
						}],
						subtitle: {
							text: aqiSubTitle,
							align: 'center',
							x: -15,
							style: {
								color: color
							}
						},
						xAxis: {
							categories: aqiTime,
							tickmarkPlacement: 'on',
							tickLength: 3,
							lineColor: color,
							tickColor: color,
							labels: {style: {color: '#000000'}, step: 2},
							//plotLines: [{color: 'red', dashStyle: 'longdash', value: 12, width: 1}],//标示线
							title: {style: {color: '#000000'}}
						},
						yAxis: {
							gridLineColor: '#DDDDDD',
							gridLineDashStyle: 'ShortDot',
							min: 1,
							labels: {style: {color: '#000000'}},
							minPadding: 0,
							startOnTick: false,
							title: {text: null}
						},
						tooltip: {
							headerFormat: '{point.key}<br>',
							pointFormat: '{series.name}：{point.y}',
							backgroundColor: 'rgba(0, 0, 0, 0.2)',
							borderWidth: 0,
							shadow: false,
							crosshairs: [true, true],
							style: {
								color: 'rgba(0, 0, 0, 0.8)',
								fontSize: '12px',
								fontWeight: 'normal'
							}
						}
					};
					$('#rainChart').highcharts($.extend({}, opt, aqiSettings));
					$('.current').hide();
					$('.average').show();
					/*平均信息*/
					if(air.aqi === 0) {
						$('.today').html('暂无数据');
						$('#aqi_num').html('/');
						$('#so2_num').html('/');
						$('#pm25_num').html('/');
						$('#co_num').html('/');
						$('#pm10_num').html('/');
						$('#no_num').html('/');
						$('#o3_num').html('/');
					} else {
						$('.today').html('今日均值');
						$('#aqi_num').html(air.aqi);
						$('#so2_num').html(air.s);
						$('#pm25_num').html(air.p25);
						$('#co_num').html(Math.round(air.c));
						$('#pm10_num').html(air.p10);
						$('#no_num').html(air.n);
						$('#o3_num').html(air.o);
					}
				}
				$('.highcharts-title').hover(function(){
					$('.allCityName').show();
				}, function(){
					$('.allCityName').hide();
				});
			}
		};
		if (type === 'hRain' || type === 'fRain') {
			//http://openapi.mlogcn.com:8000/api/nc/coor/109.281639/33.758741.json?appid=1810fc0ec981ebeb7d66657e72096ea3&timestamp=1457020807&key=PcMCzeny7HI6sNmDxJafYRJ0aK8%3D
			//'http://api.weather.mlogcn.com:8000/api/weather/v2/nc/coor/' + position.lng + '/' + position.lat + '.json'
			tools.weatherAjax(config.privateHttp + 'nc/coor/' + position.lng + '/' + position.lat + '.json?appid=' + config.appid + '&timestamp=' + privateKey.stamp + '&key=' + privateKey.token, function (data) {
				hour2 = data;
				allDataSuccess();
			});
			//'http://api.weather.mlogcn.com:8000/api/weather/v2/ob/wx/coor/' + position.lng + '/' + position.lat + '.json'
			//http://openapi.mlogcn.com:8000/api/w/ob/coor/120.751365/28.495398?appid=27fbe0976bd14ec397cd37add0526bf2&timestamp=1442477082312&key=mqC93zaI9x3whSEEasRHfOMO8bI%3D
			//config.privateHttp + 'w/ob/coor/' + position.lng + '/' + position.lat + '?appid=' + config.appid + '&timestamp=' + privateKey.stamp + '&key=' + privateKey.token
			tools.weatherAjax(config.privateHttp + 'w/ob/coor/' + position.lng + '/' + position.lat + '?appid=' + config.appid + '&timestamp=' + privateKey.stamp + '&key=' + privateKey.token, function (data) {
				cur = data.data;
				allDataSuccess();
			}, function(){
				allDataSuccess();
			});
		} else if (type === 'aqi') {
			var startTime = tools.toLocaltimeString(new Date()).substr(0, 10),
				endTime = tools.toLocaltimeString(new Date(new Date().getTime() + 1000 * 3600 * 24)).substr(0, 10);
			tools.weatherAjax(config.privateHttp + 'air/fc/coor/' + position.lng + '/' + position.lat + '/h/' + startTime + '/' + endTime + '.json?appid=' + config.appid + '&timestamp=' + privateKey.stamp + '&key=' + privateKey.token, function(data) {
				aqi = data.series;
				allDataSuccess();
			});
			tools.weatherAjax(config.privateHttp + 'air/fc/coor/' + position.lng + '/' + position.lat + '/d/' + startTime.substr(0, 8) + '/' + startTime.substr(0, 8) + '.json?appid=' + config.appid + '&timestamp=' + privateKey.stamp + '&key=' + privateKey.token, function (data) {
				air = data.series[0];
				allDataSuccess();
			});
		}
	},
	/**
	 * 向某点添加地址信息
	 * @param e
	 */
	placeMarker: function (e) {
		mlogMap.getNewAddress();
		//imageIndex = 0;
		//$('.time').css('width', 0);
		//console.log('------------------placeMarker start');

		marker.setMap(null);
		marker.setPosition(position);
		marker.setMap(e);
	},
	/**
	 * 逐步向后播放图片
	 */
	forwordByStep: function () {
		mlogMap.stop();
		imageIndex++;
		if (imageIndex > images.length) {
			imageIndex = 0;
		}
		mlogMap.shownImage();
		//console.log($('.time').css('width'));
	},
	/**
	 * 逐步向前播放图片
	 */
	backwordByStep: function () {
		mlogMap.stop();
		imageIndex--;
		if (imageIndex < 0) {
			imageIndex = images.length;
		}
		mlogMap.shownImage();
	},
	getCurPos: function () {
		function geocoder(curCity) {
			var MGeocoder;
			var geocode = {
				lng: null,
				lat: null
			};
			//加载地理编码插件
			AMap.service(['AMap.Geocoder'], function () {
				MGeocoder = new AMap.Geocoder({
					radius: 1000 //范围，默认：500
				});
				//返回地理编码结果
				MGeocoder.getLocation(curCity, function (status, result) {
					if (status === 'complete' && result.info === 'OK' && result.geocodes.length === 1) {
						geocode.lng = result.geocodes[0].location.getLng();
						geocode.lat = result.geocodes[0].location.getLat();
					} else {
						geocode.lng = 108.946;
						geocode.lat = 34.3;
					}
					//return geocode;
					//console.log(geocode);
				});
			});
		}

		AMap.service(['AMap.CitySearch'], function () {//加载城市查询插件
			var citysearch = new AMap.CitySearch();//实例化城市查询
			citysearch.getLocalCity(function (status, result) {//自动获取用户IP，返回当前城市
				if (status === 'complete' && result.info === 'OK' && result.city) {
					$('.currentCity').html(result.city);
					geocoder(result.city);
				} else {
					$('.currentCity').html('北京');
					geocoder('北京');
				}
			});
		});
	},
	deleteAddress: function(id) {
		var storage = window.localStorage;
		var key = id.getAttribute('id');
		storage.removeItem(key);
		mlogMap.showAddress();
	},
	saveAddress: function (data) {
		var storage = window.localStorage;
		var timestamp = (new Date()).valueOf();
		var len = storage.length,
			address = null,
			keys = null;
		for (var i = 0; i < len; i++) {
			keys = storage.key(i);
			if (keys.match(/^address.*$/)) {
				address = JSON.parse(storage.getItem(keys));
				//console.log(keys);
				if (data.id === address.id) {
					return;
				}
			}
		}
		//console.log(JSON.stringify(data));
		storage.setItem('address' + timestamp, JSON.stringify(data));
		$('#result1').hide('fast');
		$('#inputCityName').val('');
		mlogMap.showAddress();
	},
	showAddress: function () {
		var $addressDropdown = $('.addressDropdown');
		var $parent = $addressDropdown.parent();
		$addressDropdown.click(function () {
			if ($parent.hasClass('closeMenu')) {
				$parent.removeClass('closeMenu');
				$('.mlogicon', $addressDropdown).removeClass('icon-mlogfont-arrow').addClass('icon-mlogfont-arrowdown');
			} else {
				$parent.addClass('closeMenu');
				$('.mlogicon', $addressDropdown).removeClass('icon-mlogfont-arrowdown').addClass('icon-mlogfont-arrow');
			}
		});
		var storage = window.localStorage;
		//storage.clear();
		var len = storage.length;
		var str = '';
		var keys = null;
		var address = [];
		for (var i = 0; i < len; i++) {
			keys = storage.key(i);
			if (keys.match(/^address.*$/)) {
				address[i] = JSON.parse(storage.getItem(keys));
				//console.log(address[i]);
				str += "<li id='" + keys + "'><span class='addressName' onclick='mlogMap.selectResult(" + storage.getItem(keys) + ")'>" + address[i].name + "</span><span class='mlogicon icon-mlogfont-delete' onclick='mlogMap.deleteAddress(" + keys + ")'></span></li>";
				//str += '<li id="' + keys + '"><span class="addressName" onclick="mlogMap.selectResult(' + storage.getItem(keys) + ')">' + address[i].name + '</span><span class="mlogicon icon-mlogfont-delete" onclick="mlogMap.deleteAddress(' + keys + ')"></span></li>';
			}
		}
		$('.addressList').html(str);
		//$('.addressList').on('click', '.addressName', function() {
		//	//console.log($(this).parent().index());
		//	//console.log(address);
		//	var singleAddress = address[$(this).parent().index()];
		//	position.w = singleAddress.location.w;
		//	position.r = singleAddress.location.r;
		//	position.lng = singleAddress.location.lng;
		//	position.lat = singleAddress.location.lat;
		//	tools.mapRecenter(position, config.positionShiftFix);
		//	mlogMap.placeMarker(map);
		//});
		//$('.addressList').on('click', '.icon-mlogfont-delete', function() {
		//	//console.log($(this).parent());
		//	mlogMap.deleteAddress($(this).parent());
		//});
	},
	selectResult: function (objAddress) {
		//console.log(objAddress);
		function focusCallback() {
			if (navigator.userAgent.indexOf('MSIE') > 0) {
				//document.getElementById('keyword').onpropertychange` = autoSearch;//todo lm
			}
		}

		if (navigator.userAgent.indexOf('MSIE') > 0) {
			document.getElementById('inputCityName').onpropertychange = null;
			document.getElementById('inputCityName').onfocus = focusCallback;
		}
		//截取输入提示的关键字部分
		var text = objAddress.name;
		//console.log(objAddress.name);
		document.getElementById('inputCityName').value = text;
		//document.getElementById('result1').style.display = 'none';
		//var singleAddress = tipArr[$(this).parent().index()];
		//console.log(position);
		position = new AMap.LngLat(objAddress.location.lng, objAddress.location.lat);//经纬度构造函数
		//position.w = objAddress.location.w;
		//position.r = objAddress.location.r;
		//position.lng = objAddress.location.lng;
		//position.lat = objAddress.location.lat;
		tools.mapRecenter(position, config.positionShiftFix);
		//console.log(position);
		mlogMap.placeMarker(map);
		$('.infoPanel').show();
	},
	citySearch: function () {
		var resultDom = document.getElementById('result1');
		//输入提示
		function autocompleteCallBack(data) {
			var resultStr = '';
			var tipArr = data.tips;
			//var test = JSON.stringify(data);
			var inputLen = $('#result1').siblings('#inputCityName').width();
			var tipArrLen = tipArr.length;
			if (tipArr && tipArrLen > 0) {
				if (inputLen > 200) {//移动端
					tipArrLen = 5;
				}
				for (var i = 0; i < tipArrLen; i++) {
					var singleAddress = JSON.stringify(tipArr[i]);
					resultStr += "<div id='divid" + i + "'><span class='addressDesc' onclick='mlogMap.selectResult(" + singleAddress + ")'>" + tipArr[i].name + "</span><span class='mlogicon icon-mlogfont-add' onclick='mlogMap.saveAddress(" + singleAddress + ")'></span></div>";
					//resultStr += tools.sprintf('<div id="divid%s"><span class="addressDesc" onclick="mlogMap.selectResult(%s, %s)">%s</span><span class="mlogicon icon-mlogfont-add" onclick="mlogMap.saveAddress(%s, %s)"></span></div>', i + 1, i, test, tipArr[i].name, i, test);//多一个空格
				}
			}
			else {
				resultStr = ' π__π 亲,人家找不到结果!<br />要不试试：<br />1.请确保所有字词拼写正确<br />2.尝试不同的关键字<br />3.尝试更宽泛的关键字';
			}
			resultDom.curSelect = -1;
			resultDom.tipArr = tipArr;
			resultDom.innerHTML = resultStr;
			resultDom.style.display = 'block';

			//$('#result1').on('click', '.addressDesc', function() {
			//	//console.log(tipArr[$(this).parent().index()]);
			//	var singleAddress = tipArr[$(this).parent().index()];
			//	position.w = singleAddress.location.w;
			//	position.r = singleAddress.location.r;
			//	position.lng = singleAddress.location.lng;
			//	position.lat = singleAddress.location.lat;
			//	tools.mapRecenter(position, config.positionShiftFix);
			//	mlogMap.placeMarker(map);
			//	//AMap.setMap(map);
			//	mlogMap.selectResult(singleAddress);
			//});
			//$('#result1').on('click', '.icon-mlogfont-add', function() {
			//	//console.log($(this).parent());
			//	var singleAddress = tipArr[$(this).parent().index()];
			//	mlogMap.saveAddress(singleAddress);
			//});
		}

		function autoSearch() {
			var keywords = document.getElementById('inputCityName').value;
			var auto;
			//加载输入提示插件
			map.plugin(['AMap.Autocomplete'], function () {
				var autoOptions = {
					city: '' //城市，默认全国
				};
				auto = new AMap.Autocomplete(autoOptions);
				//查询成功时返回查询结果
				if (keywords.length > 0) {
					AMap.event.addListener(auto, 'complete', autocompleteCallBack);
					auto.search(keywords);
				}
				else {
					resultDom.style.display = 'none';
				}
			});
		}

		function keydown(event) {
			var key = (event || window.event).keyCode;
			var cur = resultDom.curSelect;
			if (key === 40) {//down key
				if (cur + 1 < resultDom.childNodes.length) {
					if (resultDom.childNodes[cur]) {
						resultDom.childNodes[cur].style.background = '';
					}
					resultDom.curSelect = cur + 1;
					resultDom.childNodes[cur + 1].style.background = '#CAE1FF';
					document.getElementById('inputCityName').value = resultDom.tipArr[cur + 1].name;
				}
			} else if (key === 38) {//up key
				if (cur - 1 >= 0) {
					if (resultDom.childNodes[cur]) {
						resultDom.childNodes[cur].style.background = '';
					}
					resultDom.curSelect = cur - 1;
					resultDom.childNodes[cur - 1].style.background = '#CAE1FF';
					document.getElementById('inputCityName').value = resultDom.tipArr[cur - 1].name;
				}
			}
			else if (key === 13) {
				if (resultDom && resultDom.curSelect !== -1) {
					//console.log(resultDom.curSelect);
					mlogMap.selectResult(resultDom.curSelect);
				}
			}
			else {
				autoSearch();
			}
		}

		document.getElementById('inputCityName').onkeyup = keydown;
	},
	mapScale: function () {
		var scale = null;
		//map = new AMap.Map("mapContainer");

		// 加载比例尺插件
		map.plugin(['AMap.Scale'], function () {
			scale = new AMap.Scale();
			map.addControl(scale);
		});

		//['show', 'hide'].forEach(function (id) {
		//AMap.event.addDomListener(document.getElementById(id), 'click', function (e) {
		//var method = this.getAttribute('data-action');
		//scale[method]();
		//}, false);
		//});
	},
	colorBoard: function () {
		cb.empty();
		cb.append('<div id="color_' + type + '_outer"><div id="color_' + type + '"></div></div>').show();
		$('#color_' + type).css({
			'-webkit-transform': 'scale(0.5)',
			'-moz-transform': 'scale(0.5)',
			'-ms-transform': 'scale(0.5)',
			'-o-transform': 'scale(0.5)',
			'transform': 'scale(0.5)',
			'-webkit-transform-origin': 'top',
			'-moz-transform-origin': 'top',
			'-ms-transform-origin': 'top',
			'-o-transform-origin': 'top',
			'transform-origin': 'top'
		});
	},
	copyRight: function(){
		var localTime = tools.toLocaltimeString(new Date());
		var copyRightStr = localTime.substr(0, 4) + '/' + localTime.substr(4, 2) + '/' + localTime.substr(6, 2) + ' ' + localTime.substr(8, 2) + ':' + localTime.substr(10, 2);
		$('.copyright-info').html(copyRightStr);
	}
};
/**
 * 项目初始化
 */
var initialize = function () {
	var isTouch = ('ontouchstart' in document.documentElement) ? 'touchstart' : 'click', newOn = $.fn.on;
	$.fn.on = function () {
		arguments[0] = (arguments[0] === 'click') ? isTouch : arguments[0];
		return newOn.apply(this, arguments);
	};
	//初始化的位置在中心点位置
	//position = new AMap.LngLat(config.center[0], config.center[1]);
	//mlogMap.placeMarker(map);
	//$('.infoPanel').hide();//lm
	tools.isFirst();
	mlogMap.citySearch();
	mlogMap.showAddress();
	$('.infoPanel').draggable({
		'containment': 'parent'
	});
	mlogMap.colorBoard();
	var oldZoom = map.getZoom();
	AMap.event.addListener(map, 'moveend', function () {
		//console.log('moveTo: ', map.getCenter());
		if(map.getZoom() >= 8) {
			mlogMap.stop();
			mlogMap.requestImages();
		}
	});
	AMap.event.addListener(map, 'zoomchange', function () {
		if (type === 'hRain' || type === 'fRain') {
			var newZoom = map.getZoom();
			if (newZoom >= 8 && oldZoom < 8 || newZoom < 8 && oldZoom >= 8) {
				mlogMap.stop();
				mlogMap.requestImages();
				//console.log(newZoom);
			}
			oldZoom = newZoom;
		}
	});
	//当地图的瓦片底图加载完毕后,加载所有的底图
	AMap.event.addListener(map, 'complete', function () {
		mlogMap.mapUserPosition();
		mlogMap.copyRight();
		mlogMap.mapScale();//加载比例尺插件
		tools.browser();
		map.plugin(['AMap.ToolBar'], function () {
			toolbar = new AMap.ToolBar({autoPosition: false});
			map.addControl(toolbar);
		});
		if(window.innerWidth < 420) {
			$('.l_body').css('height', $('body').outerHeight() - $('.l_head').outerHeight());
			$('.amap-scalecontrol').css('bottom', 225);
		} else {
			$('.l_body').css('height', 650);
		}
		mlogMap.requestImages();
		if (images.length > 0) {
			for (var i = 0; i < groundLayers.length; i++) {
				groundLayers[i].setMap(map);
			}
			mlogMap.start();
		}
	});
	AMap.event.addListener(map, 'click', function (pos) {
		if (clicked) {
			clicked = false;
			//console.log(pos.lnglat);
			position = pos.lnglat;
			mlogMap.placeMarker(map);
			$('.infoPanel').show();
			clicked = true;
		}
	});
	AMap.event.addDomListener(document.getElementById('china'), 'click', function () {
		// 设置缩放级别和中心点
		if(window.innerWidth < 420) {
			map.setZoomAndCenter(6, [108.94, 34.347]);
			map.panBy(0, -$('.infoPanel').outerHeight() / 2);
		} else {
			map.setZoomAndCenter(6, [108.94, 34.347]);
		}
		// 添加 marker 并设置中心点
		//var marker = new AMap.Marker({
		//	map: map,
		//	position: [116.205467, 39.907761]
		//});
	});
	$('.l_nav').find('button').on('click', function () {
		//console.log($(this));
		$(this).addClass('click').siblings().removeClass('click');
		if (type === this.id) {
			return;
		}
		type = this.id;
		mlogMap.stop();
		map.clearMap();

		$('#mapContainer').show();
		for (var i = 0; i < groundLayers.length; i++) {
			groundLayers[i].setMap(null);
		}
		groundLayers.length = 0;
		//images = [];

		/* lm */
		imageIndex = 0;
		$('.time').css('width', '0');
		times = [];
		/* lm */

		map.setMapStyle('normal');
		marker.show();
		mlogMap.colorBoard();
		mlogMap.requestImages();
		mlogMap.placeMarker(map);
		if(type === 'hRain') {
			$('.desc').html('临近降水：根据雷达回波的强度和动向，可进行临近天气预报，准确度较高');
		} else if(type === 'fRain') {
			$('.desc').html('预报降水：为您呈现定位地址未来2小时的降水情况');
		} else if(type === 'aqi') {
			$('.desc').html('空气质量：为您呈现定位地址未来24小时的逐小时数据，以及未来5天的日平均数据');
		}
	});
	$('#play').on('click', function () {
		if (pause === false) {
			mlogMap.stop();
		} else {
			mlogMap.start();
		}
	});
	$('#forward').on('click', function () {
		mlogMap.forwordByStep();
	});
	$('#backward').on('click', function () {
		mlogMap.backwordByStep();
	});
	$('#setFitView').on('click', function () {
		//todo set bound manually
		map.setFitView();
	});
	$('#toolBar').on('click', function () {
		if (toolSwitch) {
			toolbar.show();
		} else {
			toolbar.hide();
		}
		toolSwitch = !toolSwitch;
	});
	$('#tag').on('click', function () {
		if (markSwitch) {
			marker.show();
		} else {
			marker.hide();
		}
		markSwitch = !markSwitch;
	});
	$('#china').on('click',function(){
		$('.highcharts-title').html('西安市')
	})
	$('#menu').on('click', function () {
		var menu = $('.l_nav'), body = $('.l_body');
		if (menuSwitch) {
			menu.hide();
			body.css({'marginLeft': '0'});
		} else {
			menu.show();
			body.css({'marginLeft': '220px'});
		}
		menuSwitch = !menuSwitch;
	});
	$('span', '.searchform').on('click', function () {
		$('.phoneAddress').slideUp();
	});
	$('.closePanel').on('click', function () {
		$('.infoPanel').hide();
	});
};
$(function () {
	//todo 添加定位函数,为初始化添加初始位置<高德地图默认初始化在用户打开区域>
	initialize();
});
