let scheduleList = []
let lastUpdateTime = 'None'
let userScheduleSettingList = []
let redRadioChecked
let blueRadioChecked
let greenRadioChecked
let greyRadioChecked
let calendarboxToggle
let includeQuiz

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

				document.getElementById('summaryLoadingBar').style.display = 'none'
				document.getElementById('loadingMark').className = 'loaded'
				disableLoadingMark()
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

				let summaryLoadingBar = document.createElement('div')
				summaryLoadingBar.setAttribute('id', 'summaryLoadingBar')
				

				let summaryLoadingMark = document.createElement('img')
				summaryLoadingMark.style.width = '13px';
				summaryLoadingMark.style.height = '13px';
				summaryLoadingMark.src = chrome.extension.getURL('assets/loading.png')
				summaryLoadingMark.setAttribute('id', 'summaryLoadingMark')

				let summaryLoadingMarkText = document.createElement('div')
				summaryLoadingMarkText.textContent = '업데이트중...'

				summaryLoadingBar.appendChild(summaryLoadingMark)
				summaryLoadingBar.appendChild(summaryLoadingMarkText)
				summary.appendChild(summaryLoadingBar)


				let downImgUrl = chrome.extension.getURL('assets/down.png')
				let upImgUrl = chrome.extension.getURL('assets/up.png')
				let loadingImgUrl = chrome.extension.getURL('assets/loading.png')
				detail.innerHTML = (await data.text())
					.replace('${upImg}', upImgUrl)
					.replace('${downImg}', downImgUrl)
					.replace('${loadingImg}', loadingImgUrl)

				let root = document.getElementsByClassName('front-box front-box-course')[0]
				root.parentElement.insertBefore(box, root)

				// modalContext 메뉴 삽입
				const modalcontextMenuList = document.createElement('ul')
				modalcontextMenuList.setAttribute('id', 'modalContextMenu')
				const modalcontextMenu1 = document.createElement('li')
				modalcontextMenuList.appendChild(modalcontextMenu1)
				modalcontextMenuList.oncontextmenu = (event) => event.preventDefault()

				document.getElementById('page').appendChild(modalcontextMenuList)

				// calendarContext 메뉴 삽입
				const calendarcontextMenuList = document.createElement('ul')
				calendarcontextMenuList.setAttribute('id', 'calendarContextMenu')
				const calendarcontextMenu1 = document.createElement('li')
				calendarcontextMenu1.innerText = '세팅 초기화'
				const calendarcontextMenu2 = document.createElement('li')
				calendarcontextMenu2.setAttribute('id', 'include-quiz')
				calendarcontextMenu2.innerText = '과제에 퀴즈도 포함하기'
				calendarcontextMenuList.appendChild(calendarcontextMenu1)
				calendarcontextMenuList.appendChild(calendarcontextMenu2)
				calendarcontextMenuList.oncontextmenu = (event) => event.preventDefault()

				// calendarContext 메뉴 동작 
				calendarcontextMenu1.onclick = (event) => {
					let ans = window.confirm('모든 세팅을 초기상태로 되돌립니다. 후회 없으신가요?')
					if (ans) 
						resetAllData()
				}
				calendarcontextMenu2.onclick = (event) => {
					if (document.documentElement.style.getPropertyValue('--calendar-context-mark') == '"✓"') {
						includeQuiz = false
						chrome.storage.local.set({includeQuiz})
						setSchedule()
						document.documentElement.style.setProperty('--calendar-context-mark', '""')
					}
					else {
						includeQuiz = true
						chrome.storage.local.set({includeQuiz})
						setSchedule()
						document.documentElement.style.setProperty('--calendar-context-mark', '"✓"')
					}
				}

				document.getElementById('page').appendChild(calendarcontextMenuList)

				// modal bg 삽입
				let d = document.createElement('div')
				d.id = 'modal_bg'
				document.body.appendChild(d)
				
				resolve()
			})
			.catch((error) => {
				console.log(error)
				reject()
			})
	})
}

function resetAllData() {
	scheduleList = []
	lastUpdateTime = 'None'
	userScheduleSettingList = []
	redRadioChecked = document.getElementById('red_check').checked = true
	blueRadioChecked = document.getElementById('blue_check').checked = true
	greenRadioChecked = document.getElementById('green_check').checked = true
	greyRadioChecked = document.getElementById('grey_check').checked = true
	calendarboxToggle = true
	includeQuiz = true
	setTiemStamp()
	setSchedule()
	setRadioBox('과제')
	setRadioBox('동영상')
	setRadioBox('화상강의')
	setRadioBox('완료')
	document.documentElement.style.setProperty('--calendar-context-mark', '"✓"')
	renderMonth(nowYear, nowMonth)
	chrome.storage.local.set({
		scheduleList,
		lastUpdateTime,
		userScheduleSettingList,
		redRadioChecked,
		blueRadioChecked,
		greenRadioChecked,
		greyRadioChecked,
		calendarboxToggle,
		includeQuiz
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
			let type = s['type']
			if (type == '퀴즈') {
				if (includeQuiz)
					type = '과제'
				else
					continue
			}
			let targetClass = {'과제': 'event-hw', '동영상' : 'event-video', '화상강의' : 'event-zoom'}[type]
			let targetColor = {'과제': 'red_check', '동영상' : 'blue_check', '화상강의' : 'green_check'}[type]

			const obj = findUserSchedule(s['course'], s['title'])

			if (obj) {
				targetClass += obj['status'] ? ' event-done' : ''
				targetColor = obj['status'] ? 'grey_check' : targetColor
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

	// week 주 전부 삭제
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
			target.setAttribute('class', 'week show')
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

	const targetDate = event.path[3].id
	const targetStatus = event.path[0].className.indexOf('event-done') == -1 ? false : true
	const targetType = {'hw': '과제', 'video': '동영상', 'zoom': '화상강의'}[event.path[0].className.replace('event-done', '').trim().split('-')[1]]

	let pushList = []
	for (let schedule of scheduleList) {
		let type = schedule['type']
		if (type == '퀴즈') {
			if (includeQuiz)
				type = '과제'
			else
				continue
		}

		const obj = findUserSchedule(schedule['course'], schedule['title'])
		let status = obj ? obj['status'] : schedule['status']
		if (new Date(schedule['date']).toDateString().split(' ').join('_') == targetDate && status == targetStatus && type == targetType) {
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
	
	modal_body.setAttribute('date', targetDate)
	modal_body.style.display = 'block'
	modal_bg.style.display = 'block'
	modal_bg.style.height = document.body.scrollHeight + 'px'

	modal_body.style.left = Math.min(event.pageX, document.getElementById('page-content').offsetWidth - modal_body.clientWidth - 20) + 'px'
	modal_body.style.top = Math.max(10, event.pageY - 106  - modal_body.clientHeight) + 'px'

	// 키 인식
	modal_body.oncontextmenu = (event) => event.preventDefault()
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
	
	function contextMenuToggle(num) {
		if (num) {
			document.getElementById("modalContextMenu").style.display = 'block'
			document.getElementById('modal_bg').onclick = document.getElementById('modal_bg').oncontextmenu = (event) => event.preventDefault()
		}
		else {
			document.getElementById("modalContextMenu").style.display = 'none'
			document.getElementById('modal_bg').onclick = document.getElementById('modal_bg').oncontextmenu = modalBackgroundClickEvent
		}
	}

	function leftClickListener(event) {
		event.preventDefault()
		contextMenuToggle(0)
		document.removeEventListener("click", leftClickListener)
	}

	// 오른클릭 인식
	for (let e of modal_body.getElementsByClassName('rounded-list')[0].getElementsByTagName('li')) {
		e.oncontextmenu = (event) => {

			// 왼쪽클릭 인식
			document.addEventListener("click", leftClickListener)

			event.preventDefault()
			contextMenuToggle(1)
			document.getElementById("modalContextMenu").style.top = event.y + "px"
			document.getElementById("modalContextMenu").style.left = event.x + "px"

			// 컨텍스트메뉴 동작 설정
			const contextMenuItem = document.getElementById('modalContextMenu').children[0]

			contextMenuItem.oncontextmenu = (event) => event.preventDefault()
			
			let date = new Date((targetDate).replace(/_/gi, '-') + ' ' + e.children[0].children[0].children[1].textContent.trim())
			if (targetType == '화상강의')
				date.setHours(date.getHours() + 1)
			let userScheduleSetting = {
				'title': e.children[0].children[1].children[0].textContent,
				'course': e.children[0].children[0].children[0].textContent,
				'status': false,
				'priority': date <= new Date() ? 2 : 0,
			}
			if (targetStatus) {
				contextMenuItem.textContent = '완료상태 해제하기'
				contextMenuItem.onclick = () => {
					const obj = findUserSchedule(userScheduleSetting['course'], userScheduleSetting['title'])
					if (obj) {
						userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
					} else {
						userScheduleSettingList.push(userScheduleSetting)
					}
					chrome.storage.local.set({'userScheduleSettingList' : userScheduleSettingList})
					modalBackgroundClickEvent()
					setSchedule()
				}
			} else {
				contextMenuItem.textContent = '완료로 바꾸기'
				contextMenuItem.onclick = () => {
					userScheduleSetting['status'] = true
					const obj = findUserSchedule(userScheduleSetting['course'], userScheduleSetting['title'])
					if (obj) {
						userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
					} else {
						userScheduleSettingList.push(userScheduleSetting)
					}

					chrome.storage.local.set({'userScheduleSettingList' : userScheduleSettingList})
					modalBackgroundClickEvent()
					setSchedule()
				}
			}
		}
	}	
}

function modalBackgroundClickEvent(event) {
	if (event)
		event.preventDefault()
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
		chrome.storage.local.set({redRadioChecked})
		setRadioBox('과제')
	}
	document.getElementById('blue_check').onclick = () => {
		blueRadioChecked = document.getElementById('blue_check').checked
		chrome.storage.local.set({blueRadioChecked})
		setRadioBox('동영상')

	}
	document.getElementById('green_check').onclick = () => {
		greenRadioChecked = document.getElementById('green_check').checked
		chrome.storage.local.set({greenRadioChecked})
		setRadioBox('화상강의')

	}
	document.getElementById('grey_check').onclick = () => {
		greyRadioChecked = document.getElementById('grey_check').checked
		chrome.storage.local.set({greyRadioChecked})
		setRadioBox('완료')
	}

	function leftClickListener(event) {
		event.preventDefault()
		contextMenuToggle(0)
		document.removeEventListener("click", leftClickListener)
	}

	function contextMenuToggle(num) {
		if (num) {
			document.getElementById("calendarContextMenu").style.display = 'block'
		}
		else {
			document.getElementById("calendarContextMenu").style.display = 'none'
		}
	}

	// 캘린더에서 내에서 우클릭시 세팅
	document.getElementById('calendar-wrap').oncontextmenu = (event) => {
		document.addEventListener("click", leftClickListener)

		event.preventDefault()
		contextMenuToggle(1)
		document.getElementById("calendarContextMenu").style.top = event.y + "px"
		document.getElementById("calendarContextMenu").style.left = event.x + "px"
	}

	enableLoadingMark()
	renderMonth(nowYear, nowMonth)
}

function findUserSchedule(course, title) {
	let obj = userScheduleSettingList.find((value) => {
		return (value['course'] == course) && (value['title'] == title)
	})
	return obj
}

function setRadioBox(type) {
	const radioId = {'과제': 'red_box', '동영상': 'blue_box', '화상강의': 'green_box', '완료': 'grey_box'}[type]
	const checked = {'과제': redRadioChecked, '동영상': blueRadioChecked, '화상강의': greenRadioChecked, '완료': greyRadioChecked}[type]
	const text = {'과제': '과제', '동영상': '녹강', '화상강의': '실강', '완료': '완료'}[type] + ' ' + (checked ? '숨기기' : '보이기')
	const targetQuery = '.' + {'과제': 'event-hw', '동영상': 'event-video', '화상강의': 'event-zoom', '완료': 'event-done'}[type] +
		(type == '완료' ? '' : ':not(.event-done)')
	
	document.getElementById(radioId).children[1].textContext = text
	for (let target of document.querySelectorAll(targetQuery))
		if (target.textContent.length)
			target.setAttribute('style', 'visibility: ' + (checked ? 'visible' : 'hidden'))
}

function getCourseList() {
	return Array.from(document.getElementsByClassName('course-link')).map(value => value.href.split('?id=')[1])
}

function loadLocalStoageData() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['scheduleList', 'lastUpdateTime', 'userScheduleSettingList', 'redRadioChecked', 'blueRadioChecked', 'greenRadioChecked', 'greyRadioChecked', 'calendarboxToggle', 'includeQuiz'], (result) => {
			scheduleList = (result.scheduleList === undefined) ? [] : result.scheduleList
			lastUpdateTime = (result.lastUpdateTime === undefined) ? 'None' : result.lastUpdateTime,
			userScheduleSettingList = (result.userScheduleSettingList === undefined) ? [] : result.userScheduleSettingList,
			redRadioChecked = (result.redRadioChecked === undefined) ? true : result.redRadioChecked
			blueRadioChecked = (result.blueRadioChecked === undefined) ? true : result.blueRadioChecked
			greenRadioChecked = (result.greenRadioChecked === undefined) ? true : result.greenRadioChecked
			greyRadioChecked = (result.greyRadioChecked === undefined) ? true : result.greyRadioChecked
			calendarboxToggle = (result.calendarboxToggle === undefined) ? true : result.calendarboxToggle
			includeQuiz = (result.includeQuiz === undefined) ? true : result.includeQuiz
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
			setTimeout(async () => {
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

				// 1 시간 지난 실강 처리
				let modified = false
				for (let schedule of scheduleList) {
					if (schedule['status'] == true)
						continue
					const obj = findUserSchedule(schedule['course'], schedule['title'])
					if (obj && obj['priority'] > 1)
						continue
					let date = new Date(schedule['date'])
					if (schedule['type'] == '화상강의') {
						date.setHours(date.getHours() + 1)
						if (date <= new Date()) {
							if (obj)
								userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
							schedule['status'] = true;
							modified = true
						} 
					}
					else if (schedule['type'] == '퀴즈') {
						if (date <= new Date()) {
							if (obj) 
								userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
							schedule['status'] = true;
							modified = true
						} 
					}
				}
				await chrome.storage.local.set({scheduleList, userScheduleSettingList})
				if (modified) {
					await chrome.storage.local.set({scheduleList, userScheduleSettingList})
					setSchedule()
				}

				// 1시간이 지났으면 update
				let lastUpdateDate = new Date(lastUpdateTime)
				if (now - lastUpdateDate >= MAXIMUM_INTERVAL)
					document.getElementById('loadingMark').click()

				// 1분 이내이면 비활성화
				if (new Date() - new Date(lastUpdateTime) <= MINIMUM_INTERVAL) 
					disableLoadingMark()
				else 
					enableLoadingMark()
				
				resolve()
			}, 1000)
		})
	}
}

function disableLoadingMark() {
	const loadingMark = document.getElementById('loadingMark')
	loadingMark.parentElement.setAttribute('data-tooltip-text', "1분이내로\n동기화 금지")
	loadingMark.onclick = null
	loadingMark.style.cursor = 'not-allowed'
}

function enableLoadingMark() {
	const loadingMark = document.getElementById('loadingMark')
	loadingMark.parentElement.removeAttribute('data-tooltip-text')
	loadingMark.onclick = () => {
		if (document.getElementById('loadingMark').className != 'loading') {
			document.getElementById('summaryLoadingBar').style.display = 'flex'
			document.getElementById('loadingMark').className = 'loading'
			getSchdule()
		}
	}
	loadingMark.style.removeProperty('cursor')
}

async function main() {
	// 비 로그인화면 커팅
	if (!document.getElementsByClassName('front-box front-box-pmooc').length)
		return
	await initCalendar()
	await loadLocalStoageData()

	// 1 시간 지난 실강 처리
	let modified = false
	for (let schedule of scheduleList) {
		const obj = findUserSchedule(schedule['course'], schedule['title'])
		if (obj && obj['priority'] > 1)
			continue
		let date = new Date(schedule['date'])
		if (schedule['type'] == '화상강의') {
			date.setHours(date.getHours() + 1)
			if (date <= new Date()) {
				if (obj) 
					userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
				schedule['status'] = true;
				modified = true
			} 
		}
		else if (schedule['type'] == '퀴즈') {
			if (date <= new Date()) {
				if (obj) 
					userScheduleSettingList.splice(userScheduleSettingList.indexOf(obj), 1)
				schedule['status'] = true;
				modified = true
			} 
		}
	}
	if (modified) {
		await chrome.storage.local.set({scheduleList, userScheduleSettingList})
		setSchedule()
	}

	// checkbox 초기화
	document.getElementById('red_check').checked = redRadioChecked
	document.getElementById('blue_check').checked = blueRadioChecked
	document.getElementById('green_check').checked = greenRadioChecked
	document.getElementById('grey_check').checked = greyRadioChecked

	// 퀴즈 체크 초기화
	if (includeQuiz)
		document.documentElement.style.setProperty('--calendar-context-mark', '"✓"')

	// timestamp 초기화
	setTiemStamp()

	// schedule 초기화
	setSchedule()

	// 타이머 온
	timer()

	// 1시간이 지났거나 초기상태이면 update
	let lastUpdateDate = new Date(lastUpdateTime)
	if (now - lastUpdateDate >= MAXIMUM_INTERVAL || lastUpdateTime == 'None')
		document.getElementById('loadingMark').click()

	// 1분 이내이면 비활성화
	if (new Date() - new Date(lastUpdateTime) <= MINIMUM_INTERVAL) 
		disableLoadingMark()
	else 
		enableLoadingMark()

	// 캘린더 오픈
	window.onload = () => {
		if (calendarboxToggle)
			document.getElementById('calendar-box').toggleAttribute('open')
	}
}

main()


