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
    <div className="min-h-screen overflow-x-hidden">
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
            <span className="font-heading font-bold text-xl text-primary">BlasRodríguez</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#modulos" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Módulos</a>
            <a href="#operacion" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Operación</a>
            <a href="#soporte" className="text-gray-600 hover:text-primary transition-colors font-medium cursor-pointer">Soporte</a>
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
                <span className="text-primary font-medium text-sm">Portal interno de operación</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
              >
                Control y seguimiento de{' '}
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  tu flota
                </span>{' '}
                en un solo lugar
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
              >
                Accede al panel para gestionar vehículos, conductores y mantenimientos.
                Diseñado para uso interno y control operativo.
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
                  href="#modulos"
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-semibold border-2 border-primary/20 hover:border-primary transition-all cursor-pointer"
                >
                  Ver módulos
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 mt-12 pt-8 border-t border-gray-200">
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">Panel</p>
                  <p className="text-gray-500">Resumen operativo</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200" />
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">Gestión</p>
                  <p className="text-gray-500">Vehículos y conductores</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-200" />
                <div>
                  <p className="font-heading text-3xl font-bold text-primary">Control</p>
                  <p className="text-gray-500">Mantenimientos y estado</p>
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
                    <p className="text-sm opacity-80">Gestión operativa</p>
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
                    { icon: TrendingUp, label: 'Indicadores', color: 'bg-green-100 text-green-600' },
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
      <section id="modulos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-gray-900 mb-4">
              Módulos del sistema
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas para la operación diaria y control interno.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Car,
                title: 'Vehículos',
                description: 'Administra tu flota: alta, edición, estado operativo y asignaciones.',
                color: 'bg-primary',
                features: ['Registro y edición', 'Estados y asignaciones', 'Búsqueda y control']
              },
              {
                icon: Wrench,
                title: 'Mantenimientos',
                description: 'Registro y seguimiento de mantenimientos preventivos y correctivos.',
                color: 'bg-orange-500',
                features: ['Preventivo', 'Correctivo', 'Alertas automáticas']
              },
              {
                icon: TrendingUp,
                title: 'Reportes internos',
                description: 'Informes para seguimiento operativo y auditoría interna.',
                color: 'bg-green-500',
                features: ['Exportaciones', 'Consolidación', 'Trazabilidad']
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
      <section id="operacion" className="relative py-24 bg-gradient-to-br from-primary to-primary-800 text-white overflow-hidden">
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
              Operación y control
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Diseñado para equipos internos con foco en claridad y trazabilidad.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Flujos claros', desc: 'Altas, edición y estados operativos con formularios consistentes.' },
              { icon: Shield, title: 'Control interno', desc: 'Acceso mediante inicio de sesión y acciones trazables.' },
              { icon: TrendingUp, title: 'Indicadores', desc: 'Resumen operativo para priorizar tareas y mantenimientos.' },
              { icon: Users, title: 'Equipo', desc: 'Gestión de conductores y asignaciones de forma centralizada.' },
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
              Acceso al sistema
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Ingresa al panel para comenzar la gestión operativa.
            </p>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-semibold hover:bg-primary-800 transition-all hover:shadow-xl hover:shadow-primary/30 group cursor-pointer"
            >
              Ir al Panel
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="soporte" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-gray-900 mb-4">
              Soporte
            </h2>
            <p className="text-xl text-gray-600">
              Si necesitas ayuda, contacta al administrador del sistema.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Phone, title: 'Canal interno', content: 'Mesa de ayuda / Administrador' },
              { icon: Mail, title: 'Correo', content: 'Soporte interno' },
              { icon: MapPin, title: 'Entorno', content: 'Uso privado' },
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
              <span className="font-heading font-bold text-xl">BlasRodríguez</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 BlasRodríguez. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
