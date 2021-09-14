function ajax(options) {
	options = options || {};
	let xhr = new XMLHttpRequest();
	if (options.type === 'file') {
	  xhr.responseType = 'arraybuffer';
	}

	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4) {
		let status = xhr.status;
		if (status >= 200 && status < 300) {
		  options.success && options.success(xhr.response);
		} else {
		  options.fail && options.fail(status);
		}
	  }
	};

	xhr.open("GET", options.url, true);
	xhr.send(null);
}

function getVideoInfo(id) {
	return new Promise((resolve, reject) => {
		ajax({
			url: 'https://plato.pusan.ac.kr/report/ubcompletion/user_progress_a.php?id=' + id,
			type: 'get',
			success: (data) => {
				let result = {}
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.text-left').length) {
						let title = $(value).find('.text-left')[0].textContent.trim()
						result[title] = false
						$(value).find('.text-center').each((index, res) => {
							if (res.textContent == 'O') {
								result[title] = true
							}
						})
					}
				})
				resolve(result)
			},
			fail: () => {
				reject()
			}
		})
	})
}

function getHwInfo(courseId) {
	return new Promise((resolve, reject) => {
		ajax({
			url: 'https://plato.pusan.ac.kr/mod/assign/index.php?id=' + courseId,
			type: 'get',
			success: (data) => {
				let result = {}
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.cell.c1').length) {
						let title = $(value).find('.cell.c1')[0].textContent
						
						result[title] = {}
						result[title]['date'] = (new Date($(value).find('.cell.c2')[0].textContent)).toString()
						result[title]['status'] = $(value).find('.cell.c3')[0].textContent == '제출 완료' ? 1 : 0
					}
				})
				resolve(result)
			},
			fail: () => {
				reject()
			}
		})
	})
}

function getZoomInfo(courseId) {
	return new Promise((resolve, reject) => {
		ajax({
			url: 'https://plato.pusan.ac.kr/mod/zoom/index.php?id=' + courseId,
			type: 'get',
			success: (data) => {
				let result = {}
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.cell.c1').length) {
						let title = $(value).find('.cell.c1')[0].textContent
						result[title] = {}
						result[title]['date'] = (new Date($(value).find('.cell.c2')[0].textContent)).toString()
						result[title]['status'] = (new Date($(value).find('.cell.c2')[0].textContent)) <= (new Date())
					}
				})
				resolve(result)
			},
			fail: () => {
				reject()
			}
		})
	})
}

function getInfo(item) {
	const icons = ['동영상', '과제', '화상강의']

	let type = -1
	let date
	let link = $(item).children(0).attr('href')
	let title = $(item).find('.instancename')[0].textContent.trim()
	if ($(item).find('.instancename').find('.accesshide').length) {
		title = title.split(' ')
		title.pop()
		title = title.join(' ')
	}
	let status = 2
	for (let icon of icons) {
		if ($(item).find('.activityicon').attr('alt').indexOf(icon) != -1) {
			type = icon
			break
		}
	}
	
	if (type == -1 || link == undefined)
		return null
	
	if (type == '동영상') {
		let f = $(item).find('.text-ubstrap')
		if (f.length == 0)
			return null
		date = (new Date($(item).find('.text-ubstrap')[0].innerText.split('~')[1])).toString()
	}
	return {
		title, link, type, status, date
	}
}

async function mergeInfo(courseId) {
	let videoStatus, hwStatus, zoomstatus, objList = []
	await Promise.all([
		new Promise(async (resolve, reject) => {
			videoStatus = await getVideoInfo(courseId)
			resolve()
		}),
		new Promise(async (resolve, reject) => {
			hwStatus = await getHwInfo(courseId)
			resolve()
		}),
		new Promise(async (resolve, reject) => {
			zoomstatus = await getZoomInfo(courseId)
			resolve()
		}),
		new Promise((resolve, reject) => {
			ajax({
				url: 'https://plato.pusan.ac.kr/course/view.php?id=' + courseId,
				type: 'get',
				success: (data) => {
					let courseTitle = $(data).find('h2.coursename')[0].title.split(' ')
					courseTitle.pop()
					courseTitle = courseTitle.join(' ')
					$(data).find('#course-all-sections').find('.activityinstance').each((index, item) => {
						let obj = getInfo(item)
						if (obj) {
							obj['course'] = courseTitle
							objList.push(obj)
						}
					})
					resolve()
				},
				fail: () => {
					reject()
				}
			})
		})
	])
	for (let obj of objList) {
		if (obj['type'] == '동영상') {
			obj['status'] = videoStatus[obj['title']]
		}
		else if (obj['type'] == '과제') {
			obj['status'] = hwStatus[obj['title']]['status']
			obj['date'] = hwStatus[obj['title']]['date']
		}
		else if (obj['type'] == '화상강의') {
			obj['status'] = zoomstatus[obj['title']]['status']
			obj['date'] = zoomstatus[obj['title']]['date']
		}
	}
	return objList
} 

chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		let result = []
		for (let courseId of request.courseList) 
			result = result.concat(await mergeInfo(courseId))
		console.log(result)

		const now = new Date()
		chrome.storage.local.set({plato_schedule: result, plato_schedule_timestamp: now.toLocaleDateString().split(' ').join('') + '..' + now.toTimeString().split(' ')[0]})
		chrome.tabs.sendMessage(sender.tab.id, {msg: 'done'});
	}
);