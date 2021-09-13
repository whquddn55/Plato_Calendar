let schduleList = []
chrome.extension.onMessage.addListener(
	(request, sender, sendResponse) => {
		if (request.msg == 'done') {
			window.alert('done!')
			schduleList = request.result
			setSchedule()
		}
	});

function setSchedule() {
	for (let s of schduleList) {
		let date = new Date(s['date'])
		let target = document.getElementById(new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString().split(' ').join('_'))
		if (target) {
			if (s['status'] == 0) {
				target.getElementsByClassName('event-remain')[0].setAttribute('style', 'visibility: visible') 
				target.getElementsByClassName('event-remain')[0].innerText = parseInt(target.getElementsByClassName('event-remain')[0].innerText ? target.getElementsByClassName('event-remain')[0].innerText : 0) + 1
			}
			else if (s['status'] == 1) {
				target.getElementsByClassName('event-done')[0].setAttribute('style', 'visibility: visible') 
				target.getElementsByClassName('event-done')[0].innerText = parseInt(target.getElementsByClassName('event-done')[0].innerText ? target.getElementsByClassName('event-done')[0].innerText : 0) + 1
			}
			else if (s['status'] == 2) {
				target.getElementsByClassName('event-none')[0].setAttribute('style', 'visibility: visible') 
				target.getElementsByClassName('event-none')[0].innerText = parseInt(target.getElementsByClassName('event-none')[0].innerText ? target.getElementsByClassName('event-none')[0].innerText : 0) + 1
			}
		}
	}
}

function injectCalendar() {
	document.getElementsByClassName('front-box front-box-pmooc')[0].remove()
	document.getElementsByClassName('front-box front-box-eclass')[0].remove()
	let box = document.createElement('div')
	box.innerHTML = `
		<div id="calendar-wrap">
		<div id="calendar">
			<header id = "year">
				<h1>년 월</h1>
			</header>
			<div style = "display:flex; justify-content: center; margin-top: 30px">
				<div id="down"></div>
				<div id="up" style="margin-left: 300px;"></div>
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
	#calendar header {
		text-align: center;
		font-size: 50px;
		font-weight: bold;
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
		clear: both;
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		border-radius: 4px;
		padding-right: 5px;
		margin-bottom: 5px;
		line-height: 14px;
		text-decoration: none;
		text-align: right;
	  }
	  #calendar .event :hover {
		cursor: pointer;
	  }
	  #calendar .event-remain {
		background-color: rgba(177, 0, 0, 0.5);
		padding-top: 20px;
		text-decoration: none;
		border: 1px solid #b5dbdc;
		width: 30%;
		height: 60px;
		text-align:center;
		font-size: 15px;
	  }
	  #calendar .event-done {
		background-color: rgba(1, 62, 153, 0.5);
		padding-top: 20px;
		text-decoration: none;
		border: 1px solid #b5dbdc;
		width: 30%;
		height: 60px;
		text-align:center;
		font-size: 15px;
		
	  }
	  #calendar .event-none {
		background-color: rgba(95, 95, 95, 0.5);
		padding-top: 20px;
		text-decoration: none;
		border: 1px solid #b5dbdc;
		width: 30%;
		height: 60px;
		text-align:center;
		font-size: 15px;
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
		  width: 2em;
		  height: 2em;
		  box-sizing: border-box;
		  transform: rotate(-45deg);
		  border-width: 0.8vmin 0.8vmin 0 0;
		  border-style: solid;
		  border-color: #000000;
		  text-align: center;
	  }
	  
	  #down {
		  cursor: pointer;
		  width: 2em;
		  height: 2em;
		  box-sizing: border-box;
		  transform: rotate(135deg);
		  border-width: 0.8vmin 0.8vmin 0 0;
		  border-style: solid;
		  border-color: #000000;
		  text-align: center;
		  margin: -15px;
	  }
	  `
		document.getElementsByTagName('head')[0].appendChild(style)
}

const now = new Date()
const nowYear = now.getFullYear()
const nowMonth = now.getMonth() 
const nowDate = now.getDate()
const nowDay = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()]

let showYear = nowYear
let showMonth = nowMonth

function renderMonth(year, month) {
	document.getElementById('year').innerText = year + ' ' + (month + 1 < 10 ? '0' + (month + 1): (month + 1))

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

	setSchedule()
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
	newDate.innerText = date.getDate()

	let newEvent = document.createElement('div')
	newEvent.setAttribute('class', 'event')

	let newEventRemain = document.createElement('div')
	newEventRemain.setAttribute('class', 'event-remain')
	newEventRemain.style.visibility = 'hidden'
	newEventRemain.onclick = () => {console.log(1)}

	let newEventDone = document.createElement('div')
	newEventDone.setAttribute('class', 'event-done')
	newEventDone.style.visibility = 'hidden'
	newEventDone.onclick = () => {console.log(2)}

	let newEventNone = document.createElement('div')
	newEventNone.setAttribute('class', 'event-none')
	newEventNone.style.visibility = 'hidden'
	newEventNone.onclick = () => {console.log(3)}
	
	target.appendChild(newDay)
	newDay.appendChild(newDate)
	newDay.appendChild(newEvent)
	newEvent.appendChild(newEventRemain)
	newEvent.appendChild(newEventDone)
	newEvent.appendChild(newEventNone)
}

function initCalendar() {
	injectCalendar()
	renderMonth(nowYear, nowMonth)

	document.getElementById('down').onclick = () => {
		showMonth--;
		if (showMonth < 0)
			--showYear
		showMonth = (showMonth + 12) % 12
		renderMonth(showYear, showMonth)
	}
	document.getElementById('up').onclick = () => {
		showMonth++;
		if (showMonth >= 12)
			++showYear
		showMonth = (showMonth + 12) % 12
		renderMonth(showYear, showMonth)
	}
}

function getCourceList() {
	return Array.from(document.getElementsByClassName('course-link')).map(value => value.href.split('?id=')[1])
}
function getSchdule() {
	let courceList = getCourceList()
	chrome.runtime.sendMessage({courceList: courceList});
}

getSchdule()

initCalendar()

