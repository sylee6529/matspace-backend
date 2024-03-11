# 🌟맛스페이스

# 📝 [목차](#index) <a name = "index"></a>

- [⚡개요](#outline)
- [⛳기획 배경](#purpose)
- [🎇핵심 기능](#mainFunction)
- [🎯결과물](#result)
- [🏅기술적 챌린지](#technicalChallenge)
- [🗼기술스택](#techStack)
- [👏팀원 소개](#introduce)

## ⚡개요<a name = "outline"></a>

![poster](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/7d498b0a-83fb-4f06-a89d-80439297c1b9)

## ⛳기획 배경<a name = "purpose"></a>

1. 참여한 **모두의 선택**을 **고려**한
2. 함께 **만족**할 만한 **식당 찾기**!
3. 서로 얼굴도 보면서 말하니 좋고!
4. 생각치도 못한 추천도 받아서 더욱 좋고!

**좋은 일만 가득한~~~**

### 맛 스 페 이 스 !!!!

## 🎇핵심 기능<a name = "mainFunction"></a>

### 맛집 추천

- 약 7만 개의 서울 시 맛집 데이터 수집!
- 데이터를 정제하여 1만 8천 식당을 선정
- 각 식당의 요소를 벡터화
- 유저의 니즈에 따른 식당 추천!

![f1](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/4fc3dc59-807b-45f3-848f-aa3da0483d1f)

### 식당 조합

- 분위기와 메뉴를 활용한 식당 데이터 벡터화
- 유클리드 거리 계산을 통해 식당 간의 유사도 측정
- K-NN 알고리즘을 통한 인접한 식당 탐색

![f2](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/0563c65c-cd66-4803-aba1-1e45d7dd5a52)

### 연관 키워드 추천

- 유저가 말한 문장을 Konlpy로 토큰화
- 수집한 문장으로 벡터 모델 학습
- Word2Vec를 활용하여 위 모델을 통해 연관 단어 맵핑

![f3](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/21e5aee1-3fbb-4ba4-85bf-e1387fd1cbe3)

### 실시간 유저소통

- Mesh방식 WebRTC 구현
- Socket.IO를 활용

![f4](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/111bfbbb-d7ec-4389-a6e7-cf47b927abbf)

## 🎯결과물<a name = "result"></a>

[![시연 영상](https://img.youtube.com/vi/2M5mylkvO1Q/default.jpg)](https://www.youtube.com/watch?v=2M5mylkvO1Q)<br>
(클릭 시, Youtube로 이동됩니다!)

## 🏅기술적 챌린지<a name = "technicalChallenge"></a>

### **벡터화 모델 직접 학습으로 키워드 연관도 개선**

- **문제** : 기존에 존재하는 모델인 **FastText**를 사용했을 때,
  키워드의 **연관성**이 높지 않고, 그 **유사도**가 기대하던 수준에 미치지 못함 - **우리에게 필요한 데이터**만 **정밀도를 높일** 수 있다면 좋을텐데… - **맛집 추천 데이터**만 가지고 구축을 한다면 결과가 나아지지 않을까?
- **해결** : 데이터 수집 후 **Word2Vec** 를 활용하여 자체 모델 학습으로 **연관도 개선**

![c1](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/d3e1d2b4-9253-4cde-b928-c7bcf581392d)

### **알고리즘을 통한 식당 조합 기능 구현**

- **문제1** : 식당과 식당을 조합하는 기능을 구현할 때,
  **유사도가 먼 경우** 조합 결과가 나오지 않는 현상을 경험 - **벡터화**된 **식당**들을 **공간** 상에 존재한다 여긴다면
  **기하학**과 관련된 알고리즘을 사용할 수 있지 않을까?
- **해결1**: 각각의 식당벡터의 **중간 지점**을
  **유클리드 거리**를 통해 구할 수 있었다!
- **문제2** : 그러나 해당 지점과 일치하는 **식당 벡터가 있다는
  보장이 없다** 생각하였기에 추가적인 알고리즘이 필요하였다 - 이 지점과 가능한 **가까운 실제 식당**을 구하면 될 것 같은데??
- **해결2: K-최근접 이웃 (K-Nearest Neighbors, KNN)** 을 통해 해당하는 중간 지점과
  **가까운 식당**을 찾아 추천할 수 있게 되었다!

![c2](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/777b7ac1-b0ef-403a-8193-aeae440f4be3)

### **Buffer 활용을 통한 소켓 요청 - 응답 안정화**

- **문제** : 음성 인식을 통한 키워드 분석을 위해 ‘대량’의 소켓 요청을 보낸 결과,
  **간헐적으로 서버 다운 or 서버 부하 증가** - 매 요청마다 데이터를 전송하는 것이 아니라,
  **일정 주기로 모았다 보내준다**면 이러한 현상을 개선할 수 있지 않을까 고려 - **Buffer**라는 개념을 소켓 요청에 응용하여,
  많은 양의 데이터를 하나의 소켓에 모아 보낸다면 가능할 것이라 생각 - 조사를 해보니 다양한 이벤트 처리 방식 중,
  **Debouncing**과 **Throttling**이 데이터를 모아 보내는 것에 적합하다 판단
- **해결: 일정 시간마다 반응**을 보여주어야 **UX**에 더 좋은 결과를 얻을 수 있다고 여겨
  **Throttling** 방식을 채택하여 **버퍼 구현** 및 **응답 안정화**

![c3](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/648e8c37-da13-48f2-a1c0-657469f042fb)

## 🗼기술스택<a name = "techStack"></a>

![기술스택](https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/0dafeab5-20e4-45ef-bf19-52fc942114ce)

## 👏팀원 소개<a name = "introduce"></a>

<table>
  <tr>
    <td>
      <img src="https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/5aef30b1-cef2-42ea-938a-ab9b4f888182" alt="마찬옥" width="300"/>
    </td>
    <td width="600">
      <strong>마찬옥</strong> (<a href="https://github.com/horsecano">깃허브</a>)<br>
        - 팀장<br>
        - 프론트엔드<br>
        - UI / UX 설계 및 구현<br>
        - 디자인 및 컨셉 담당<br>
        - 미디어 스트리밍 구현(WebRTC)<br>
        - 실시간 기능 구현 (Socket.io)<br>
        - 클라이언트 - 서버 API 구현 (Axios)<br>
    </td>
  </tr>
</table>
<table>
  <tr>
<td>
      <img src="https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/e59e3b4f-55b1-4e5b-abfa-880c15496285" alt="천지영" width="300"/>
    </td>
    <td width="600">
      <strong>천지영</strong> (<a href="https://github.com/geeks-lab">깃허브</a>)<br>
        - 팀원<br>
        - 백엔드<br>
        - Python 서버 구축<br>
        - 데이터 수집<br>
        - 프로그램 메인 로직 구현<br>
    </td>
  </tr>
</table>

<table>
  <tr>
      <td>
      <img src="https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/fb831020-9006-4d3f-9e44-b715c791ca52" alt="이서연" width="300"/>
    </td>
    <td width="600">
      <strong>이서연</strong> (<a href="https://github.com/sylee6529">깃허브</a>)<br>
        - 팀원<br>
        - 백엔드<br>
        - nest js 서버 구축<br>
        - Redis 서버 구축<br>
        - 데이터 수집<br>
        - Python ↔ nest ↔ Front 의 API , Socket의 명세 및 구성<br>
        - 배포<br>
    </td>
        </tr>
</table>
<table>
  <tr>
    <td>
      <img src="https://github.com/Moojuck-KJ3/Front_end_ver2/assets/43630972/cb31a590-e6b5-42aa-84ce-3e398d5d7f39" alt="현재훈" width="300"/>
    </td>
    <td width="600">
      <strong>현재훈</strong> (<a href="https://github.com/hnjog">깃허브</a>)<br>
        - 팀원<br>
        - 프론트엔드<br>
        - 프론트 fast API 및 socket 관련 명세 및 구성 참여<br>
        - 애니메이션 및 effect 담당 (css, tailwind, gsap 등)<br>
        - git 관련 이슈 해결 및 프론트 git 전략<br>
        - 데이터 수집 작업 참여<br>
        - 팀 내 이슈 해결에 적극 참여 (언어, 로직 관련)<br>
        - 제안된 아이디어 구현 (Throttling Buffer)<br>
        - UX 경험 증감에 기여<br>
    </td>
  </tr>
</table>
