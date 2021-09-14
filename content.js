let scheduleList = []
let schedule_timestamp = 'None'
let init_redbox_status
let init_bluebox_status
let init_greenbox_status
let init_greybox_status

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
			chrome.storage.local.get(['plato_schedule', 'plato_schedule_timestamp'], (result) => {
				scheduleList = result.plato_schedule
				schedule_timestamp = result.plato_schedule_timestamp
				setSchedule()
				setTiemStamp()
				document.getElementById('loader').className = 'loaded'
			})
		}
	});

function injectCalendar() {
	document.getElementsByClassName('front-box front-box-pmooc')[0].remove()
	document.getElementsByClassName('front-box front-box-eclass')[0].remove()
	let box = document.createElement('div')
	box.innerHTML = `
	<div id="modal_bg"></div>
	<div id="modal_body">
		모달창 내용
	</div>
	<div id="calendar-wrap">
		<div id="calendar">
			<header>
				<div style="display: flex; align-self: flex-end; width:30%;">
					<div id = "loader"></div>
					<div id = "loaded_timestamp" style="font-size:12px; margin-left: 7px;"></div>
				</div>
				<div style="display: flex; align-items: center;">
					<img id="down" src=${chrome.extension.getURL('assets/down.png')} title="저번 달">
					<h1 id = "year" style = "margin: 0px 15px;">년 월</h1>
					<img id="up" src=${chrome.extension.getURL('assets/up.png')} title="저번 달">
				</div>
				<div id="checkbox_wrap" style = "width:30%; text-align:end;">
					<div class="custom_chbox" id = "red_box">
						<input type="checkbox" id='red_check' checked>
						<label for="red_check">과제 숨기기</label>
					</div>
					<div class="custom_chbox" id = "blue_box">
						<input type="checkbox" id='blue_check' checked>
						<label for="blue_check">녹강 숨기기</label>
					</div>
					<div class="custom_chbox" id = "green_box">
						<input type="checkbox" id='green_check' checked>
						<label for="green_check">실강 숨기기</label>
					</div>
					<div class="custom_chbox" id = "grey_box">
						<input type="checkbox" id='grey_check' checked>
						<label for="grey_check">완료 숨기기</label>
					</div>
				</div>
				
			</header>
			<div style = "display:flex; justify-content: center;">
				
			</div>
			<ul class="weekdays">
				<li>월</li>
				<li>화</li>
				<li>수</li>
				<li>목</li>
				<li>금</li>
				<li>토</li>
				<li>일</li>
			</ul>
		</div>
	</div>
	`
	document.getElementsByClassName('front-box front-box-notice')[0].parentElement.append(box)

	let style = document.createElement('style')
	style.innerHTML = `
	:root {
		--list-element-background: #87ceeb
	}
	#calendar-wrap {
		height: 900px;
	}
	  #calendar header {
		display:flex;
		justify-content: space-between;
		font-size: 25px;
		font-weight: bold;
		height: 100px;
	  }
	  #calendar {
		width: 100%;
	  }
	  #calendar a {
		color: #8e352e;
		text-decoration: none;
	  }
	  #calendar ul {
		list-style: none;
		padding: 0;
		margin: 0;
		width: 100%;
	  }
	  #calendar li {
		display: block;
		float: left;
		width: 14.285%;
		padding: 5px;
		box-sizing: border-box;
		border: 1px solid #ccc;
	  }
	  #calendar ul.weekdays {
		height: 40px;
		background: #3088c5;
	  }
	  #calendar ul.weekdays li {
		text-align: center;
		text-transform: uppercase;
		line-height: 20px;
		border: none !important;
		padding: 10px 6px;
		color: #fff;
		font-size: 13px;
	  }
	  #calendar .week li {
		height: 100px;
	  }
	  #calendar .week li:hover {
		background: #d3d3d3;
	  }
	  #calendar .date {
		text-align: center;
		margin-bottom: 5px;
		padding: 2px;
		color: #000;
		width: 20px;
		border-radius: 50%;
		font-weight: bold;
		float: right;
	  }
	  #calendar .event {
		display: flex;
		justify-content: space-between;
		clear: both;
		font-size: 13px;
		border-radius: 4px;
		padding-right: 5px;
		margin-bottom: 5px;
		line-height: 14px;
		text-decoration: none;
		text-align: right;
	  }
	  #calendar .event-box {
		width: 30%;
	  }
	  #calendar .event-hw,.event-video,.event-zoom:hover{
		cursor: pointer;
	  }
	  #calendar .event-hw {
		background-color: rgba(177, 0, 0, 0.5);
		text-decoration: none;
		border: 1px solid #b5dbdc;
		border-radius: 4px;
		width: 100%;
		height: 30px;
		line-height: 30px;
		text-align:center;
		font-size: 15px;
	  }
	  #calendar .event-video {
		background-color: rgba(1, 62, 153, 0.5);
		text-decoration: none;
		border: 1px solid #b5dbdc;
		border-radius: 4px;
		width: 100%;
		height: 30px;
		line-height: 30px;
		text-align:center;
		font-size: 15px;
	  }
	  #calendar .event-zoom {
		background-color: rgba(104, 197, 16, 0.5);
		text-decoration: none;
		border: 1px solid #b5dbdc;
		border-radius: 4px;
		width: 100%;
		height: 30px;
		line-height: 30px;
		text-align:center;
		font-size: 15px;
	  }
	  
	  #calendar .event-done {
		background-color: rgba(95, 95, 95, 0.5);
	  }
	  #calendar .other-month {
		background: #e2e2e2;
		color: #666;
	  }
	  #calendar .today{
		  background-color: #fffdbb
	  }
	  
	  /* ============================
					  Mobile Responsiveness
		 ============================*/
	  @media (max-width: 768px) {
		#calendar .weekdays, #calendar .other-month {
		  display: none;
		}
		#calendar li {
		  height: auto !important;
		  border: 1px solid #ededed;
		  width: 100%;
		  padding: 10px;
		  margin-bottom: -1px;
		}
		#calendar .date {
		  float: none;
		}
	  }
	  #up {
		  cursor: pointer;
		  font-size: 13px;
		  width: 2em;
		  height: 2em;
		  text-align: center;
	  }
	  
	  #down {
		  cursor: pointer;
		  font-size: 13px;
		  width: 2em;
		  height: 2em;
		  text-align: center;
	  }
	  .custom_chbox {
		height: 20px
	}
	label::selection  {
		background-color: transparent;
	}
	  .custom_chbox input[type=checkbox]{
		-webkit-appearance: none;
		position:absolute;
		width:22px;
		vertical-align:middle;
	}
	.custom_chbox#red_box input[type=checkbox] + label{
		display: inline-block;
		cursor: pointer;
		position: relative;
		padding-left: 25px;
		margin-right: 15px;
		font-size: 13px;
		font-weight: bold;
		color: rgba(177, 0, 0, 0.5)
	}
	.custom_chbox#blue_box input[type=checkbox] + label{
		display: inline-block;
		cursor: pointer;
		position: relative;
		padding-left: 25px;
		margin-right: 15px;
		font-size: 13px;
		font-weight: bold;
		color: rgba(1, 62, 153, 0.5);
	}
	.custom_chbox#green_box input[type=checkbox] + label{
		display: inline-block;
		cursor: pointer;
		position: relative;
		padding-left: 25px;
		margin-right: 15px;
		font-size: 13px;
		font-weight: bold;
		color: rgba(104, 197, 16, 0.5);
	}
	.custom_chbox#grey_box input[type=checkbox] + label{
		display: inline-block;
		cursor: pointer;
		position: relative;
		padding-left: 25px;
		margin-right: 15px;
		font-size: 13px;
		font-weight: bold;
		color: rgba(95, 95, 95, 0.5);
	}
	.custom_chbox input[type=checkbox] + label:before{
		border: 1px solid #000;
		content:"";
		display:inline-block;
		width:16px;
		margin-right:10px;
		position:absolute;
		top:0;
		left:0;
		bottom:1px;
		background-color:#f7f7f7;
		border-radius:2px; 
	}
	.custom_chbox#red_box input[type=checkbox]:checked + label:before{
		text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
		background:rgba(177, 0, 0, 0.5);
		text-align:center;
	}
	.custom_chbox#blue_box input[type=checkbox]:checked + label:before{
		text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
		background:rgba(1, 62, 153, 0.5);
		text-align:center;
	}
	.custom_chbox#green_box input[type=checkbox]:checked + label:before{
		text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
		background:rgba(104, 197, 16, 0.5);
		text-align:center;
	}
	.custom_chbox#grey_box input[type=checkbox]:checked + label:before{
		text-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
		background:rgba(95, 95, 95, 0.5);
		text-align:center;
	}
	#loader {
		cursor: pointer;
		display: block;
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 7px solid #000;
		border-top: 7px solid #1467e2;
	}
	#loader.loading {
		animation: spin 0.5s linear infinite;
	}
	#loader.loaded {
		animation: spin 0.5s linear 2;
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	#modal_body{
		display: none;
		position: absolute;
		background:#eee;
		z-index: 2;
		width: 500px;
		max-height: 550px;
		overflow-y: auto;
	}
	#modal_bg{
		display: none;
		position: absolute;
		content: "";
		width: 100%;
		height: 100%;
		background-color:rgba(0, 0,0, 0.3);
		top:0;
		left: 0;
		z-index: 1;
	}
	#modal_body::-webkit-scrollbar {
		display: none;
	}
	#modal_body ol {
		counter-reset: li; /* Initiate a counter */
		list-style: none; /* Remove default numbering */
		*list-style: decimal; /* Keep using default numbering for IE6/7 */
		font: 15px 'trebuchet MS', 'lucida sans';
		padding: 0;
		text-shadow: 0 1px 0 rgba(255,255,255,.5);
	  }
	
	#modal_body .rounded-list a{
		position: relative;
		display: block;
		padding: .4em .4em .4em 2em;
		*padding: .4em;
		margin: .5em 10px;
		background: #ddd;
		color: #444;
		text-decoration: none;
		border-radius: 1em;
		transition: all .3s ease-out;
	}
	
	#modal_body .rounded-list a:hover{
		background: #eee;
	}
	
	#modal_body .rounded-list a:hover:before{
		transform: rotate(360deg);
	}
	
	#modal_body .rounded-list a:before{
		content: counter(li);
		counter-increment: li;
		position: absolute;
		left: -0.8em;
		top: 55%;
		color: #fff;
		margin-top: -1.3em;
		background: var(--list-element-background);
		height: 2em;
		width: 2em;
		line-height: 1.3em;
		border: .3em solid #fff;
		text-align: center;
		font-weight: bold;
		border-radius: 2em;
		transition: all .3s ease-out;
	}
	  `
	document.getElementsByTagName('head')[0].appendChild(style)
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
			if (s['status'] == 2)
				console.error('[PLATO_CALANER ERROR]undifiend status on ' + s['title'])
			if (s['type'] == '과제') {
				let targetClass = 'event-hw'
				if (s['status'] == 1) {
					targetClass += ' event-done'
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('grey_check').checked ? 'visible' : 'hidden'))
				}
				else {
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('red_check').checked ? 'visible' : 'hidden'))
				}
			}
			else if (s['type'] == '동영상') {
				let targetClass = 'event-video'
				if (s['status'] == 1) {
					targetClass += ' event-done'
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('grey_check').checked ? 'visible' : 'hidden'))
				}
				else {
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('blue_check').checked ? 'visible' : 'hidden'))
				}	
			}
			else if (s['type'] == '화상강의') {
				let targetClass = 'event-zoom'
				if (s['status'] == 1) {
					targetClass += ' event-done'
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('grey_check').checked ? 'visible' : 'hidden'))
				}
				else {
					target.getElementsByClassName(targetClass)[0].textContent = parseInt(target.getElementsByClassName(targetClass)[0].textContent ? target.getElementsByClassName(targetClass)[0].textContent : 0) + 1
					target.getElementsByClassName(targetClass)[0].setAttribute('style', 'visibility :' + (document.getElementById('green_check').checked ? 'visible' : 'hidden'))
				}	
			}
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

function eventButtonFunction(event) {
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
					<div class = "remaintime" style = "font-weight: bold;">
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
	const status = event.path[0].className.indexOf('event-done') == -1 ? 0 : 1
	const type = {'hw': '과제', 'video': '동영상', 'zoom': '화상강의'}[event.path[0].className.replace('event-done', '').trim().split('-')[1]]

	let pushList = []
	for (let schedule of scheduleList) {
		if (new Date(schedule['date']).toDateString().split(' ').join('_') == date && schedule['status'] == status && schedule['type'] == type) {
			pushList.push({
				'root' : modal_body.getElementsByClassName('rounded-list')[0],
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
		addToList(e['root'], e['data'], e['color'])
	
	modal_body.setAttribute('date', date)
	modal_body.style.display = 'block'
	modal_bg.style.display = 'block'

	modal_body.style.left = event.layerX + 'px'
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
	newEventHw.onclick = eventButtonFunction

	let newEventVideo = document.createElement('div')
	newEventVideo.setAttribute('class', 'event-video')
	newEventVideo.style.visibility = 'hidden'
	newEventVideo.onclick = eventButtonFunction

	let newEventZoom = document.createElement('div')
	newEventZoom.setAttribute('class', 'event-zoom')
	newEventZoom.style.visibility = 'hidden'
	newEventZoom.onclick = eventButtonFunction

	let newEventHwDone = document.createElement('div')
	newEventHwDone.setAttribute('class', 'event-hw event-done')
	newEventHwDone.style.visibility = 'hidden'
	newEventHwDone.onclick = eventButtonFunction

	let newEventVideoDone = document.createElement('div')
	newEventVideoDone.setAttribute('class', 'event-video event-done')
	newEventVideoDone.style.visibility = 'hidden'
	newEventVideoDone.onclick = eventButtonFunction

	let newEventZoomDone = document.createElement('div')
	newEventZoomDone.setAttribute('class', 'event-zoom event-done')
	newEventZoomDone.style.visibility = 'hidden'
	newEventZoomDone.onclick = eventButtonFunction

	let modal_body = document.getElementById('modal_body')
	let modal_bg = document.getElementById('modal_bg')
	modal_bg.onclick = () => {
		modal_body.scrollTo(0, 0)
		modal_body.style.display = 'none'
		modal_bg.style.display = 'none'
		window.onkeydown = null
	}

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

function initCalendar() {
	injectCalendar()
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
		toggle('red_check', 'red_box', '과제 ')
		chrome.storage.local.set({'plato_red_box': document.getElementById('red_check').checked})
	}
	document.getElementById('blue_check').onclick = () => {
		toggle('blue_check', 'blue_box', '녹강 ')
		chrome.storage.local.set({'plato_blue_check': document.getElementById('blue_check').checked})

	}
	document.getElementById('green_check').onclick = () => {
		toggle('green_check', 'green_box', '실강 ')
		chrome.storage.local.set({'plato_green_check': document.getElementById('green_check').checked})

	}
	document.getElementById('grey_check').onclick = () => {
		toggle('grey_check', 'grey_box', '완료 ')
		chrome.storage.local.set({'plato_grey_check': document.getElementById('grey_check').checked})
	}
	document.getElementById('loader').onclick = () => {
		if (document.getElementById('loader').className != 'loading') {
			document.getElementById('loader').className = 'loading'
			getSchdule()
		}
	}
	renderMonth(nowYear, nowMonth)
}

function toggle(id1, id2, text) {
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

	if (document.getElementById(id1).checked) {
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
		chrome.storage.local.get(['plato_schedule', 'plato_schedule_timestamp', 'plato_red_box', 'plato_blue_check', 'plato_green_check', 'plato_grey_check'], (result) => {
				scheduleList = (result.plato_schedule === undefined) ? [] : result.plato_schedule
				schedule_timestamp = (result.plato_schedule_timestamp === undefined) ? 'None' : result.plato_schedule_timestamp
				init_redbox_status = (result.plato_red_box === undefined) ? true : result.plato_red_box
				init_bluebox_status = (result.plato_blue_check === undefined) ? true : result.plato_blue_check
				init_greenbox_status = (result.plato_green_check === undefined) ? true : result.plato_green_check
				init_greybox_status = (result.plato_grey_check === undefined) ? true : result.plato_grey_check
			resolve()
		})
	})
}

function setTiemStamp() {
	document.getElementById('loaded_timestamp').innerText = '동기화 시간(10초 정도 소요) \n' + schedule_timestamp
}

function getSchdule() {
	let courseList = getCourseList()
	chrome.runtime.sendMessage({courseList: courseList});
}

async function timer() {
	while (true) {
		await new Promise((resolve, reject) => {
			setTimeout(() => {
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
				resolve()
			}, 1000)
		})
	}
}

async function main() {
	if (!document.getElementsByClassName('front-box front-box-pmooc').length)
		return
	initCalendar()
	await loadLocalStoageData()

	// checkbox 초기화
	document.getElementById('red_check').checked = init_redbox_status
	document.getElementById('blue_check').checked = init_bluebox_status
	document.getElementById('green_check').checked = init_greenbox_status
	document.getElementById('grey_check').checked = init_greybox_status

	// timestamp 초기화
	setTiemStamp()

	// schedule 초기화
	setSchedule()

	timer()

	// 6시간 이 지났으면 update
	let lastUpdateDate = new Date(schedule_timestamp)
	if (now - lastUpdateDate >= 3600 * 1000 * 6 || schedule_timestamp == 'None')
		document.getElementById('loader').click()
}



main()

