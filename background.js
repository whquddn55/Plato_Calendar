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
				let result = []
				let aTagList = $(data).find('.breadcrumb')[0].getElementsByTagName('a')
				let temp
				for (let aTag of aTagList) {
					if (aTag.href.indexOf('course/view.php') != -1){
						temp = aTag
						break
					}
				}
				temp = temp.textContent.split(' ')
				temp.pop()
				const courseTitle = temp.join(' ')
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.text-left').length) {
						let title = $(value).find('.text-left')[0].textContent.trim()
						let temp = {}
						temp['title'] = title
						temp['status'] = false
						$(value).find('.text-center').each((index, res) => {
							if (res.textContent == 'O') {
								temp['status'] = true
							}
						})
						temp['course'] = courseTitle
						temp['type'] = '동영상'

						result.push(temp)
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
				let result = []

				let aTagList = $(data).find('.breadcrumb')[0].getElementsByTagName('a')
				let temp
				for (let aTag of aTagList) {
					if (aTag.href.indexOf('course/view.php') != -1){
						temp = aTag
						break
					}
				}
				temp = temp.textContent.split(' ')
				temp.pop()
				const courseTitle = temp.join(' ')
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.cell.c1').length) {
						let title = $(value).find('.cell.c1')[0].textContent.trim()
						let temp = {}
						temp['title'] = title
						temp['link'] = $(value).find('.cell.c1 a')[0].href
						temp['date'] = (new Date($(value).find('.cell.c2')[0].textContent)).toString()
						temp['status'] = $(value).find('.cell.c3')[0].textContent == '제출 완료'
						temp['type'] = '과제'
						temp['course'] = courseTitle
						result.push(temp)
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
				let result = []
				let aTagList = $(data).find('.breadcrumb')[0].getElementsByTagName('a')
				let temp
				for (let aTag of aTagList) {
					if (aTag.href.indexOf('course/view.php') != -1){
						temp = aTag
						break
					}
				}
				temp = temp.textContent.split(' ')
				temp.pop()
				const courseTitle = temp.join(' ')
				$(data).find('tr').each((index, value) => {
					if ($(value).find('.cell.c1').length) {
						let title = $(value).find('.cell.c1')[0].textContent.trim()
						let temp = {}
						temp['title'] = title
						temp['link'] = 'https://plato.pusan.ac.kr/mod/zoom/' + $(value).find('.cell.c1 a')[0].getAttribute('href')
						temp['date'] = (new Date($(value).find('.cell.c2')[0].textContent)).toString()
						temp['status'] = (new Date($(value).find('.cell.c2')[0].textContent)) <= (new Date())
						temp['type'] = '화상강의'
						temp['course'] = courseTitle
						result.push(temp)
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

function getOtherInfo(item) {
	let type = $(item).find('.activityicon').attr('alt').trim()
	if (type != '동영상')
		return null
	let link = $(item).children(0).attr('href')
	if (link == undefined)
		return null

	let title = $(item).find('.instancename')[0].textContent.trim()
	if ($(item).find('.instancename').find('.accesshide').length) {
		title = title.split(' ')
		title.pop()
		title = title.join(' ')
	}
	
	let temp = $(item).find('.text-ubstrap')
	if (temp.length == 0)
		return null
	let date = (new Date(temp[0].innerText.split('~')[1])).toString()
	
	let res = {}
	res['title'] = title
	res['link'] = link
	res['date'] = date
	return res
}

async function getInfo(courseId) {
	let videoStatus, hwStatus, zoomStatus, videoStatusOthers = []
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
			zoomStatus = await getZoomInfo(courseId)
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
						let temp = getOtherInfo(item)
						if (temp)
							videoStatusOthers.push(temp)
					})
					resolve()
				},
				fail: () => {
					reject()
				}
			})
		})
	])

	let result = []
	for (let v of videoStatusOthers) {
		let obj = videoStatus.find(value => value.title == v.title)
		if (obj) 
			result.push(Object.assign(v, obj))
	}
	result = result.concat(hwStatus, zoomStatus)
	return result
} 

chrome.runtime.onMessage.addListener(
	async (request, sender, sendResponse) => {
		let result = []
		for (let courseId of request.courseList) 
			result = result.concat(await getInfo(courseId))
		console.log(result)

		const now = new Date()
		chrome.storage.local.set({plato_schedule: result, plato_schedule_timestamp: now.toLocaleDateString().split(' ').join('') + '..' + now.toTimeString().split(' ')[0]})
		chrome.tabs.sendMessage(sender.tab.id, {msg: 'done'});
	}
);