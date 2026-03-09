'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Car, 
  Users, 
  Wrench, 
  TrendingUp, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const floatAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-primary">FlotaMaster</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Servicios</a>
            <a href="#beneficios" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Beneficios</a>
            <a href="#contacto" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Contacto</a>
            <Link 
              href="/login"
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-all hover:shadow-lg hover:shadow-primary/30 cursor-pointer"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-accent-light">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1 }}
            className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary rounded-full blur-3xl"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary rounded-full blur-3xl"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(13,71,161,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,71,161,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-accent-light px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium text-sm">Líderes en administración de flota</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-heading text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
              >
                Administra tu{' '}
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  flota de taxis
                </span>{' '}
                y colectivos
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
              >
                Control total de tu flota de vehículos. 
                Mantenimientos, asignaciones y seguimiento en un solo lugar.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link 
                  href="/login"
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary-800 transition-all hover:shadow-xl hover:shadow-primary/30 group cursor-pointer"
                >
                  Acceder al Panel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#contacto"
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-semibold border-2 border-primary/20 hover:border-primary transition-all cursor-pointer"
                >
                  Contactar
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200">
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">50+</p>
                  <p className="text-gray-500">Vehículos gestionados</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">100%</p>
                  <p className="text-gray-500">Control total</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">24/7</p>
                  <p className="text-gray-500">Disponibilidad</p>
                </div>
              </motion.div>
            </div>

            <motion.div 
              variants={floatAnimation}
              animate="animate"
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-primary/20 p-8 border border-white/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
                    <Car className="w-8 h-8 mb-3 opacity-80" />
                    <p className="text-2xl font-bold">Taxis</p>
                    <p className="text-sm opacity-80">Alquiler semanal</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-light to-white rounded-2xl p-6 border border-primary/10">
                    <Users className="w-8 h-8 text-primary mb-3" />
                    <p className="text-2xl font-bold text-primary">Colectivos</p>
                    <p className="text-sm text-gray-500">Flota completa</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: Wrench, label: 'Mantenimientos', color: 'bg-orange-100 text-orange-600' },
                    { icon: TrendingUp, label: 'Ganancias', color: 'bg-green-100 text-green-600' },
                    { icon: Shield, label: 'Control', color: 'bg-purple-100 text-purple-600' },
                  ].map((item, i) => (
                    <div key={i} className={`${item.color} rounded-xl p-4 text-center`}>
                      <item.icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-xs font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative elements */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-24 h-24 border-2 border-dashed border-primary/20 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-dashed border-secondary/20 rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para administrar tu flota de taxis y colectivos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Car,
                title: 'Gestión de Flota',
                description: 'Control total de taxis y colectivos. Administra disponibilidad, asignaciones y seguimiento en tiempo real.',
                color: 'bg-primary',
                features: ['Vehículos propios', 'Control de flota', 'Asignación dinámica']
              },
              {
                icon: Wrench,
                title: 'Mantenimientos',
                description: 'Registro y seguimiento de mantenimientos preventivos y correctivos. Mantén tus vehículos en óptimas condiciones.',
                color: 'bg-orange-500',
                features: ['Preventivo', 'Correctivo', 'Alertas automáticas']
              },
              {
                icon: TrendingUp,
                title: 'Control Financiero',
                description: 'Tracking completo de ganancias y gastos por vehículo. Sabrás exactamente cuánto ganas con cada taxi.',
                color: 'bg-green-500',
                features: ['Ganancias por auto', 'Gastos por auto', 'Reportes totales']
              },
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 bg-gradient-to-br from-primary to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold mb-4">
              ¿Por qué elegir FlotaMaster?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              La herramienta más completa para tu negocio de alquiler de taxis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Ahorro de Tiempo', desc: 'Automatiza el seguimiento de mantenimientos y rentals' },
              { icon: Shield, title: 'Control Total', desc: 'Visibilidad completa de tu flota en tiempo real' },
              { icon: TrendingUp, title: 'Maximiza Ganancias', desc: 'Optimiza el rendimiento de cada vehículo' },
              { icon: Users, title: 'Gestión de Choferes', desc: 'Asigna y controla a tus conductores fácilmente' },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all"
              >
                <benefit.icon className="w-10 h-10 mb-4 text-accent" />
                <h3 className="font-heading font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-white/70 text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: '50+', label: 'Vehículos' },
              { number: '100%', label: 'Control' },
              { number: '24/7', label: 'Disponibilidad' },
              { number: '0', label: 'Complejidad' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-heading text-4xl font-bold text-accent">{stat.number}</p>
                <p className="text-white/70">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-12 shadow-2xl shadow-primary/10 border border-primary/10"
          >
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
              ¿Listo para optimizar tu flota?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Accede al panel de administración y toma control total de tu negocio
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary-800 transition-all hover:shadow-xl hover:shadow-primary/30 group cursor-pointer"
            >
              Ir al Panel de Administración
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-gray-900 mb-4">
              Contáctanos
            </h2>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Phone, title: 'Teléfono', content: '+57 300 123 4567' },
              { icon: Mail, title: 'Email', content: 'contacto@flotamaster.com' },
              { icon: MapPin, title: 'Ubicación', content: 'Colombia' },
            ].map((contact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl"
              >
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <contact.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{contact.title}</p>
                  <p className="text-gray-600">{contact.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">FlotaMaster</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 FlotaMaster. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
