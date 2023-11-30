import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../libs/prismadb'
import { validateExercises } from '@/app/helpers/api-helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  let res
  try {
    res = await prisma.workout.findUnique({
      where: {
        id: id,
      },
    })
  } catch (e) {
    res = {}
  }

  prisma.$disconnect()

  return NextResponse.json(res)
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  var { name, date, location, notes, exercises } = await req.json()
  const { id } = params

  const session = await getServerSession(authOptions as any)

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    exercises = validateExercises(exercises)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (!exercises || exercises.length === 0) {
    return NextResponse.json(
      { error: 'Exercises are required' },
      { status: 400 }
    )
  }

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: {
      id: (session as any)?.user.id,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Could not find user.' }, { status: 401 })
  }

  const workout = await prisma.workout.findUnique({
    where: {
      id,
      userId: user.id,
    },
  })

  if (!workout) {
    return NextResponse.json(
      { error: 'Could not find workout.' },
      { status: 401 }
    )
  }

  const updatedWorkout = await prisma.workout.update({
    where: {
      id,
    },
    data: {
      name: name.trim(),
      date,
      location: location?.trim(),
      notes,
      exercises,
    },
  })

  return NextResponse.json(updatedWorkout)
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
    )
  }

  const session = await getServerSession(authOptions as any)

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: {
      id: (session as any)?.user.id,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Could not find user.' }, { status: 404 })
  }

  try {
    const deletedWorkout = await prisma.workout.delete({
      where: {
        id,
      },
    })
    return NextResponse.json(deletedWorkout)
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 400 })
  }
}
