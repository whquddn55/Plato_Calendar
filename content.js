let scheduleList = []
let lastUpdateTime = 'None'
let userScheduleSettingList = []
let redRadioChecked
let blueRadioChecked
let greenRadioChecked
let greyRadioChecked
let calendarboxToggle

const MINIMUM_INTERVAL = 1000 * 60 // 1분
const MAXIMUM_INTERVAL = 1000 * 60 * 60 // 1시간

const now = new Date()
const nowYear = now.getFullYear()
const nowMonth = now.getMonth() 
const nowDate = now.getDate()
const nowDay = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()]

let showYear = nowYear
let showMonth = nowMonth

chrome.extension.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg == 'done') {
			chrome.storage.local.get(['scheduleList', 'lastUpdateTime'], (result) => {
				scheduleList = result.scheduleList
				lastUpdateTime = result.lastUpdateTime
				setSchedule()
				setTiemStamp()
				document.getElementById('loader').className = 'loaded'
				disableLoader()
			})
		}
	});

async function injectCalendar() {
	return new Promise((resolve, reject) => {
		let link = document.createElement('link')
		link.rel = "stylesheet"
		link.href = chrome.extension.getURL('assets/calendar.css')
		document.head.appendChild(link)

		let calendarUrl = chrome.extension.getURL('assets/calendar.html')
		fetch(calendarUrl)
			.then(async (data) => {
				let htmldata = await data.text()
				let downImgUrl = chrome.extension.getURL('assets/down.png')
				let upImgUrl = chrome.extension.getURL('assets/up.png')

				htmldata = htmldata.replace('${upImg}', upImgUrl).replace('${downImg}', downImgUrl)

				let box = document.createElement('details')
				let summary = document.createElement('summary')
				let detail = document.createElement('div')
				summary.innerText = 'PLATO 달력'
				box.appendChild(summary)
				box.appendChild(detail)
				box.setAttribute('id', 'calendar-box')
				box.ontoggle = () => {
					calendarboxToggle = box.open
					chrome.storage.local.set({'calendarboxToggle': calendarboxToggle})
				}
				detail.innerHTML = htmldata

				let position = document.getElementsByClassName('front-box front-box-course')[0]
				position.parentElement.insertBefore(box, position)

				// context 메뉴 삽입
				const contextMenuList = document.createElement('ul')
				contextMenuList.setAttribute('id', 'context-menu')
				const contextMenu1 = document.createElement('li')
				contextMenu1.innerText = '안녕하세요'
				contextMenuList.appendChild(contextMenu1)
				document.getElementById('page').appendChild(contextMenuList)

				resolve()
			})
			.catch((error) => {
				console.log(error)
				reject()
			})
	})
}

function setSchedule() {
	for (let target of document.getElementsByClassName('event-hw')) {
		target.textContent = ''
		target.setAttribute('style', 'visibility : hidden')
	}
	for (let target of document.getElementsByClassName('event-video')) {
		target.textContent = ''
		target.setAttribute('style', 'visibility : hidden')
	}
	for (let target of document.getElementsByClassName('event-zoom')) {
		target.textContent = ''
		target.setAttribute('style', 'visibility : hidden')
	}
	for (let s of scheduleList) {
		let date = new Date(s['date'])
		let target = document.getElementById(new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString().split(' ').join('_'))

		if (target) {
			let targetClass = {'과제': 'event-hw', '동영상' : 'event-video', '화상강의' : 'event-zoom'}[s['type']]
			let targetColor = {'과제': 'red_check', '동영상' : 'blue_check', '화상강의' : 'green_check'}[s['type']]

			let userScheduleSetting = userScheduleSettingList.find((value) => {
				return value['course'] == s['course'] && value['title'] == s['title']
			})
			if (userScheduleSetting) {
				targetClass += userScheduleSetting['status'] ? ' event-done' : ''
				targetColor = userScheduleSetting['status'] ? 'grey_check' : targetColor
			} else {
				targetClass += s['status'] ? ' event-done' : ''
				targetColor = s['status'] ? 'grey_check' : targetColor
			}
			target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
			target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById(targetColor).checked ? 'visible' : 'hidden'))
		}
	}
}

function renderMonth(year, month) {
	document.getElementById('year').textContent = year + ' ' + (month + 1 < 10 ? '0' + (month + 1): (month + 1))

	let t = document.getElementsByClassName('week')
	while (t.length) {
		t[0].remove()
	}
	let renderFrom = new Date(year, month, 1)
	while(renderFrom.getDay() != 1) 
		renderFrom.setDate(renderFrom.getDate() - 1)

	let renderTo = new Date(year, month + 1, 0)
	let cnt = 2 + (renderTo.getDay() == 0)
	while(cnt) {
		while(renderTo.getDay()) 
			renderTo.setDate(renderTo.getDate() + 1)
		--cnt
		renderTo.setDate(renderTo.getDate() + 1)
	}

	let columnCnt = 0
	let target
	while(renderTo.toDateString() != renderFrom.toDateString()) {
		if (columnCnt == 0) {
			target = document.createElement('ul')
			target.setAttribute('class', 'week')
			document.getElementById('calendar').append(target)
		}
		addCalendarItem(target, month, renderFrom)
		renderFrom.setDate(renderFrom.getDate() + 1)
		columnCnt += 1
		columnCnt %= 7
	}
	document.getElementById('calendar').appendChild(target)
}

function eventButtonClickEvent(event) {
	const addToList = (root, item, color) => {
		document.documentElement.style.setProperty('--list-element-background', color)
		let remainDate = new Date(item['date']) - new Date()
		if (remainDate < 0)
			remainDate = 0
		let remainDay = parseInt(remainDate / (3600 * 24 * 1000))
		let remainHour = parseInt(remainDate % (3600 * 24 * 1000) / (3600 * 1000))
		let remainMinute = parseInt(remainDate % (3600 * 1000) / (60 * 1000))
		let remainSecond = parseInt(remainDate % (60 * 1000) / (1000))
		remainHour = remainHour <= 9 ? '0' + remainHour : remainHour
		remainMinute = remainMinute <= 9 ? '0' + remainMinute : remainMinute
		remainSecond = remainSecond <= 9 ? '0' + remainSecond : remainSecond

		let remainTime = ''
		if (remainDay)
			remainTime = remainDay + '일 '
		remainTime += [remainHour, remainMinute, remainSecond].join(':')
		root.innerHTML += `
			<li>
				<a href=${item['link']}>
				<div style="display: flex; justify-content: space-between;">
					<div>${item['course']}</div>
					<div class = "duetime">
						${new Date(item['date']).toTimeString().split(' ')[0]}
					</div>
				</div>
				<div style="display: flex; justify-content: space-between;">
					<div style = "width: 350px; white-space : nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold;">${item['title']}</div>
					<div class = "remaintime" style = "font-weight: bold;text-align: right;">
					${remainTime}
					</div>
				</div>
				</a>
			</li>
		`
	}

	const modal_body = document.getElementById('modal_body')
	const modal_bg = document.getElementById('modal_bg')
	modal_body.innerHTML = `
		<ol class = "rounded-list">
		</ol>
	`

	const date = event.path[3].id
	const status = event.path[0].className.indexOf('event-done') == -1 ? false : true
	const type = {'hw': '과제', 'video': '동영상', 'zoom': '화상강의'}[event.path[0].className.replace('event-done', '').trim().split('-')[1]]

	let pushList = []
	for (let schedule of scheduleList) {
		let userScheduleSetting = userScheduleSettingList.find((value) => {
			return schedule['course'] == value['course'] && schedule['title'] == value['title']
		})
		let targetStatus = userScheduleSetting ? userScheduleSetting['status'] : schedule['status']
		if (new Date(schedule['date']).toDateString().split(' ').join('_') == date && targetStatus == status && schedule['type'] == type) {
			pushList.push({
				'data' : schedule,
				'color' : window.getComputedStyle(event.path[0])['background-color'].replace('0.5', '1.0')
			})
		}
	}
	pushList.sort((a, b) => {
		const aValue = new Date(a['data']['date'])
		const bValue = new Date(b['data']['date'])
		if (aValue == bValue)
			return a['data']['course'] < b['data']['course'] ? -1 : 1
		return aValue < bValue ? -1 : 1
	})
	for (let e of pushList)
		addToList(modal_body.getElementsByClassName('rounded-list')[0], e['data'], e['color'])
	
	modal_body.setAttribute('date', date)
	modal_body.style.display = 'block'
	modal_bg.style.display = 'block'

	modal_body.style.left = Math.min(event.layerX, document.getElementById('page-content').offsetWidth - modal_body.clientWidth - 20) + 'px'
	modal_body.style.top = event.layerY - modal_body.clientHeight + 'px'

	// 키 인식
	window.onkeydown = (e) => {
		if (e.key == 'Escape')
			modal_bg.click()
		else if (parseInt(e.key) != NaN) {
			let idx = parseInt(e.key) - 1
			if (pushList.length > idx) {
				modal_body.getElementsByClassName('rounded-list')[0].children[idx].children[0].click()
			}
		}
	}
	
	function toggleOnOff(num) {
		if (num) {
			document.getElementById("context-menu").style.display = 'block'
			document.getElementById('modal_bg').onclick = null
		}
		else {
			document.getElementById("context-menu").style.display = 'none'
			document.getElementById('modal_bg').onclick = modalBackgroundClickEvent
		}
	}
	function showMenu(x, y) {
		document.getElementById("context-menu").style.top = y + "px"
		document.getElementById("context-menu").style.left = x + "px"
	}

	// 왼쪽클릭 인식
	document.addEventListener("click", () => {
		toggleOnOff(0)
	})

	// 오른클릭 인식
	for (let e of modal_body.getElementsByClassName('rounded-list')[0].getElementsByTagName('li')) {
		e.oncontextmenu = (event) => {
			event.preventDefault()
			toggleOnOff(1)
			showMenu(event.x, event.y)

			// 컨텍스트메뉴 동작 설정
			const contextMenuItem = document.getElementById('context-menu').children[0]

			if (status) {
				contextMenuItem.textContent = '완료상태 해제하기'
				let userScheduleSetting = {
					'title': e.children[0].children[1].children[0].textContent,
					'course': e.children[0].children[0].children[0].textContent,
					'status': false
				}
				let obj = userScheduleSettingList.find((value) => {
					return (value['course'] == userScheduleSetting['course']) && (value['title'] == userScheduleSetting['title'])
				})
				if (obj) {
					userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
				} else {
					userScheduleSettingList.push(userScheduleSetting)
				}
				contextMenuItem.onclick = () => {
					chrome.storage.local.set({'userScheduleSettingList' : userScheduleSettingList})
					modalBackgroundClickEvent()
					setSchedule()
				}
			} else {
				contextMenuItem.textContent = '완료로 바꾸기'
				let userScheduleSetting = {
					'title': e.children[0].children[1].children[0].textContent,
					'course': e.children[0].children[0].children[0].textContent,
					'status': true
				}
				let obj = userScheduleSettingList.find((value) => {
					return (value['course'] == userScheduleSetting['course']) && (value['title'] == userScheduleSetting['title'])
				})
				if (obj) {
					userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
				} else {
					userScheduleSettingList.push(userScheduleSetting)
				}
				contextMenuItem.onclick = () => {
					chrome.storage.local.set({'userScheduleSettingList' : userScheduleSettingList})
					modalBackgroundClickEvent()
					setSchedule()
				}
			}
		}
	}	
}

function modalBackgroundClickEvent() {
	const modal_body = document.getElementById('modal_body')
	const modal_bg = document.getElementById('modal_bg')
	modal_body.scrollTo(0, 0)
	modal_body.style.display = 'none'
	modal_bg.style.display = 'none'
	window.onkeydown = null
}

function addCalendarItem(target, targetMonth, date) {
	let newDay = document.createElement('li')
	newDay.classList.add('day')
	if (date.toDateString() == now.toDateString())
		newDay.classList.add('today')
	if (date.getMonth() != targetMonth)
		newDay.classList.add('other-month')
	
	newDay.setAttribute('id', date.toDateString().split(' ').join('_'))

	let newDate = document.createElement('div')
	newDate.setAttribute('class', 'date')
	newDate.textContent = date.getDate()

	let newEvent = document.createElement('div')
	newEvent.setAttribute('class', 'event')

	let eventBox1 = document.createElement('div')
	eventBox1.setAttribute('class', 'event-box')

	let eventBox2 = document.createElement('div')
	eventBox2.setAttribute('class', 'event-box')

	let eventBox3 = document.createElement('div')
	eventBox3.setAttribute('class', 'event-box')

	let newEventHw = document.createElement('div')
	newEventHw.setAttribute('class', 'event-hw')
	newEventHw.style.visibility = 'hidden'
	newEventHw.onclick = eventButtonClickEvent

	let newEventVideo = document.createElement('div')
	newEventVideo.setAttribute('class', 'event-video')
	newEventVideo.style.visibility = 'hidden'
	newEventVideo.onclick = eventButtonClickEvent

	let newEventZoom = document.createElement('div')
	newEventZoom.setAttribute('class', 'event-zoom')
	newEventZoom.style.visibility = 'hidden'
	newEventZoom.onclick = eventButtonClickEvent

	let newEventHwDone = document.createElement('div')
	newEventHwDone.setAttribute('class', 'event-hw event-done')
	newEventHwDone.style.visibility = 'hidden'
	newEventHwDone.onclick = eventButtonClickEvent

	let newEventVideoDone = document.createElement('div')
	newEventVideoDone.setAttribute('class', 'event-video event-done')
	newEventVideoDone.style.visibility = 'hidden'
	newEventVideoDone.onclick = eventButtonClickEvent

	let newEventZoomDone = document.createElement('div')
	newEventZoomDone.setAttribute('class', 'event-zoom event-done')
	newEventZoomDone.style.visibility = 'hidden'
	newEventZoomDone.onclick = eventButtonClickEvent

	let modal_bg = document.getElementById('modal_bg')
	modal_bg.onclick = modalBackgroundClickEvent

	target.appendChild(newDay)
	newDay.appendChild(newDate)
	newDay.appendChild(newEvent)
	newEvent.appendChild(eventBox1)
	newEvent.appendChild(eventBox2)
	newEvent.appendChild(eventBox3)

	eventBox1.appendChild(newEventHw)
	eventBox1.appendChild(newEventHwDone)
	eventBox2.appendChild(newEventVideo)
	eventBox2.appendChild(newEventVideoDone)
	eventBox3.appendChild(newEventZoom)
	eventBox3.appendChild(newEventZoomDone)
}

async function initCalendar() {
	await injectCalendar()
	document.getElementById('down').onclick = () => {
		showMonth--;
		if (showMonth < 0)
			--showYear
		showMonth = (showMonth + 12) % 12
		renderMonth(showYear, showMonth)
		setSchedule()
	}
	document.getElementById('up').onclick = () => {
		showMonth++;
		if (showMonth >= 12)
			++showYear
		showMonth = (showMonth + 12) % 12
		renderMonth(showYear, showMonth)
		setSchedule()
	}
	document.getElementById('red_check').onclick = () => {
		redRadioChecked = document.getElementById('red_check').checked
		setRadioBox('red_check', 'red_box', '과제 ', redRadioChecked)
		chrome.storage.local.set({'redRadioChecked': redRadioChecked})
	}
	document.getElementById('blue_check').onclick = () => {
		blueRadioChecked = document.getElementById('blue_check').checked
		setRadioBox('blue_check', 'blue_box', '녹강 ', blueRadioChecked)
		chrome.storage.local.set({'blueRadioChecked': blueRadioChecked})

	}
	document.getElementById('green_check').onclick = () => {
		greenRadioChecked = document.getElementById('green_check').checked
		setRadioBox('green_check', 'green_box', '실강 ', greenRadioChecked)
		chrome.storage.local.set({'greenRadioChecked': greenRadioChecked})

	}
	document.getElementById('grey_check').onclick = () => {
		greyRadioChecked = document.getElementById('grey_check').checked
		setRadioBox('grey_check', 'grey_box', '완료 ', greyRadioChecked)
		chrome.storage.local.set({'greyRadioChecked': greyRadioChecked})
	}

	enableLoader()
	renderMonth(nowYear, nowMonth)
}

function setRadioBox(id1, id2, text, checked) {
	let getEventClass = (text) => {
		if (text == '과제 ')
			return 'event-hw'
		else if (text == '녹강 ')
			return 'event-video'
		else if (text == '실강 ')
			return 'event-zoom'
		else if (text == '완료 ')
			return 'event-done'
	}

	if (checked) {
		document.getElementById(id2).children[1].textContent = text + '숨기기'

		let targetClass = getEventClass(text)
		if (targetClass == 'event-done') {
			for (let target of document.getElementsByClassName(targetClass)) {
				if (target.textContent.length)
					target.setAttribute('style', 'visibility: visible')
			}
		}
		else {
			for (let target of document.querySelectorAll('.' + targetClass + ':not(.event-done)')) {
				if (target.textContent.length)
					target.setAttribute('style', 'visibility: visible')
			}
		}
	}
	else{
		document.getElementById(id2).children[1].textContent = text + '보이기'
		
		let targetClass = getEventClass(text)
		if (targetClass == 'event-done') {
			for (let target of document.getElementsByClassName(targetClass)) {
				if (target.textContent.length)
					target.setAttribute('style', 'visibility: hidden')
			}
		}
		else {
			for (let target of document.querySelectorAll('.' + targetClass + ':not(.event-done)')) {
				if (target.textContent.length)
					target.setAttribute('style', 'visibility: hidden')
			}
		}
	}
}

function getCourseList() {
	return Array.from(document.getElementsByClassName('course-link')).map(value => value.href.split('?id=')[1])
}

function loadLocalStoageData() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['scheduleList', 'lastUpdateTime', 'userScheduleSettingList', 'redRadioChecked', 'blueRadioChecked', 'greenRadioChecked', 'greyRadioChecked', 'calendarboxToggle'], (result) => {
			scheduleList = (result.scheduleList === undefined) ? [] : result.scheduleList
			lastUpdateTime = (result.lastUpdateTime === undefined) ? 'None' : result.lastUpdateTime,
			userScheduleSettingList = (result.userScheduleSettingList === undefined) ? [] : result.userScheduleSettingList,
			redRadioChecked = (result.redRadioChecked === undefined) ? true : result.redRadioChecked
			blueRadioChecked = (result.blueRadioChecked === undefined) ? true : result.blueRadioChecked
			greenRadioChecked = (result.greenRadioChecked === undefined) ? true : result.greenRadioChecked
			greyRadioChecked = (result.greyRadioChecked === undefined) ? true : result.greyRadioChecked
			calendarboxToggle = (result.calendarboxToggle === undefined) ? true : result.calendarboxToggle
			resolve()
		})
	})
}

function setTiemStamp() {
	document.getElementById('loaded_timestamp').innerText = '동기화 시간(10초 정도 소요) \n' + lastUpdateTime
}

function getSchdule() {
	let courseList = getCourseList()
	chrome.runtime.sendMessage({courseList: courseList});
}

async function timer() {
	while (true) {
		await new Promise((resolve, reject) => {
			setTimeout(() => {
				// modal 창 타이머
				const modal_body = document.getElementById('modal_body')
				let liList = modal_body.getElementsByTagName('li')
				for (let li of liList) {
					let dueTime = new Date(modal_body.getAttribute('date').split('_').join(' ') + ' ' + li.getElementsByClassName('duetime')[0].innerText)
					let remainDate = dueTime - new Date()
					if (remainDate < 0)
						remainDate = 0
					let remainDay = parseInt(remainDate / (3600 * 24 * 1000))
					let remainHour = parseInt(remainDate % (3600 * 24 * 1000) / (3600 * 1000))
					let remainMinute = parseInt(remainDate % (3600 * 1000) / (60 * 1000))
					let remainSecond = parseInt(remainDate % (60 * 1000) / (1000))
					remainHour = remainHour <= 9 ? '0' + remainHour : remainHour
					remainMinute = remainMinute <= 9 ? '0' + remainMinute : remainMinute
					remainSecond = remainSecond <= 9 ? '0' + remainSecond : remainSecond

					let remainTime = ''
					if (remainDay)
						remainTime = remainDay + '일 '
					remainTime += [remainHour, remainMinute, remainSecond].join(':')

					li.getElementsByClassName('remaintime')[0].innerText = remainTime
				}

				// 1시간이 지났으면 update
				let lastUpdateDate = new Date(lastUpdateTime)
				if (now - lastUpdateDate >= MAXIMUM_INTERVAL || lastUpdateTime == 'None')
					document.getElementById('loader').click()

				// 1분 이내이면 비활성화
				if (new Date() - new Date(lastUpdateTime) <= MINIMUM_INTERVAL) 
					disableLoader()
				else 
					enableLoader()
				
				resolve()
			}, 1000)
		})
	}
}

function disableLoader() {
	const loader = document.getElementById('loader')
	loader.setAttribute('data-tooltip-text', "1분이내로\n동기화 금지")
	loader.onclick = null
	loader.style.cursor = 'not-allowed'
	loader.style.borderTop = '7px solid rgb(177, 0, 0)'
}

function enableLoader() {
	const loader = document.getElementById('loader')
	loader.removeAttribute('data-tooltip-text')
	loader.onclick = () => {
		if (document.getElementById('loader').className != 'loading') {
			document.getElementById('loader').className = 'loading'
			getSchdule()
		}
	}
	loader.style.removeProperty('cursor')
	loader.style.borderTop = '7px solid rgb(20, 103, 226)'
}

async function main() {
	if (!document.getElementsByClassName('front-box front-box-pmooc').length)
		return
	await initCalendar()
	await loadLocalStoageData()

	// 시간 지난 실강 처리
	let modified = false
	for (let schedule of scheduleList) {
		if (schedule['type'] == '화상강의' && schedule['status'] == false) {
			if (new Date(schedule['date']) <= now) {
				schedule['status'] = true;
				modified = true
			} 
		}
	}
	if (modified)
		await chrome.storage.local.set({'scheduleList': scheduleList})

	// checkbox 초기화
	document.getElementById('red_check').checked = redRadioChecked
	document.getElementById('blue_check').checked = blueRadioChecked
	document.getElementById('green_check').checked = greenRadioChecked
	document.getElementById('grey_check').checked = greyRadioChecked

	// timestamp 초기화
	setTiemStamp()

	// schedule 초기화
	setSchedule()

	// 타이머 온
	timer()

	// 1시간이 지났으면 update
	let lastUpdateDate = new Date(lastUpdateTime)
	if (now - lastUpdateDate >= MAXIMUM_INTERVAL || lastUpdateTime == 'None')
		document.getElementById('loader').click()

	// 1분 이내이면 비활성화
	if (new Date() - new Date(lastUpdateTime) <= MINIMUM_INTERVAL) 
		disableLoader()
	else 
		enableLoader()

	window.onload = () => {
		// 캘린더 오픈
		if (calendarboxToggle)
			document.getElementById('calendar-box').toggleAttribute('open')
	}

}

main()

