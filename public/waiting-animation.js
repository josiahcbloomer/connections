class WaitingAnimation {
	constructor(canvas) {
		this.canvas = canvas
		this.ctx = canvas.getContext("2d")
		this.particles = []
		this.colors = ["#f9df6d", "#a0c35a", "#b0c4ef", "#ba81c5"]
		this.init()
	}

	init() {
		this.resize()
		window.addEventListener("resize", () => this.resize())

		// Create 40 particles (10 of each color)
		for (let i = 0; i < 40; i++) {
			this.particles.push({
				x: Math.random() * this.canvas.width,
				y: Math.random() * this.canvas.height,
				radius: Math.random() * 20 + 10,
				dx: (Math.random() - 0.5) * 4,
				dy: (Math.random() - 0.5) * 4,
				color: this.colors[Math.floor(i / 10)],
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.02,
			})
		}
	}

	resize() {
		this.canvas.width = window.innerWidth
		this.canvas.height = window.innerHeight
	}

	animate() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

		this.particles.forEach(particle => {
			// Move
			particle.x += particle.dx
			particle.y += particle.dy
			particle.rotation += particle.rotationSpeed

			// Bounce off walls
			if (particle.x < 0 || particle.x > this.canvas.width) particle.dx *= -1
			if (particle.y < 0 || particle.y > this.canvas.height) particle.dy *= -1

			// Draw particle
			this.ctx.save()
			this.ctx.translate(particle.x, particle.y)
			this.ctx.rotate(particle.rotation)

			// Draw a fun shape (hexagon)
			this.ctx.beginPath()
			for (let i = 0; i < 5; i++) {
				const angle = (i * Math.PI * 2) / 5
				const x = Math.cos(angle) * particle.radius
				const y = Math.sin(angle) * particle.radius
				if (i === 0) this.ctx.moveTo(x, y)
				else this.ctx.lineTo(x, y)
			}
			this.ctx.closePath()
			this.ctx.fillStyle = particle.color
			this.ctx.fill()

			this.ctx.restore()
		})

		requestAnimationFrame(() => this.animate())
	}
}
