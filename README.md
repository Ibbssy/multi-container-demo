# 🦸‍♂️ Superhero Dispatch Network (SDN) 🚨

**Welcome, Agent!**  
Congratulations on becoming the newest member of the Superhero Dispatch Network (SDN) – where saving the world is just another day at the office. 😎

Our mission?  
Dispatch superheroes with lightning speed to where they’re needed most.  
Your toolkit? A cutting-edge, multi-container application – just waiting for you to deploy!

---

## 🏁 Quickstart: Activate Your SDN Console

**Step 1: Clone the SDN Super Project Repository**
```bash
git clone <your-repo-url>
cd <repo-directory>
```

**Step 2: Start Colima**
```bash
colima start
```

**Step 3: Assemble the SDN with Docker Compose**
```bash
docker compose up --build
```
*subsequent commands on the same machine can remove build tag*

**Step 4: Clock in and Dispatch! ⏰**\
Access to Dispatch Network http://localhost:6160

## 💻 How Does It All Work?

When SDN is running, agents (users) enter their name on the homepage.
If registered, our intelligence systems instantly greet their superhero identity (e.g., “Mecha Man 🦾”).
Seamless communication between a Spring Boot backend and a Node.js/Express frontend powers your SDN Command Center, all within isolated Docker containers.

## 💬 Useful SDN Commands

| ACTION                     | COMMAND                           |
|----------------------------|-----------------------------------|
| Start Colima               | ```colima start```                |
| Build & Run SDN Containers | ```docker compose up --build```   |
| Stop All SDN Activities    | ```docker compose down```         |
| View backend logs          | ```docker-compose logs backend``` |
| View backend logs          | ```docker-compose logs backend``` |

# 🫡 Ready? Happy Dispatching!