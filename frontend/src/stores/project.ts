import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectsApi } from '@/api'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<any[]>([])
  const currentProject = ref<any | null>(null)

  async function fetchProjects() {
    const { data } = await projectsApi.list()
    if (data.success) {
      projects.value = data.data
      // Set current project from localStorage or first active project
      const savedId = localStorage.getItem('currentProjectId')
      if (savedId) {
        const found = projects.value.find((p) => p.id === Number(savedId))
        currentProject.value = found || projects.value[0] || null
      } else {
        currentProject.value = projects.value.find((p) => p.aktif) || projects.value[0] || null
      }
    }
  }

  function setCurrentProject(project: any) {
    currentProject.value = project
    localStorage.setItem('currentProjectId', String(project.id))
  }

  return { projects, currentProject, fetchProjects, setCurrentProject }
})
